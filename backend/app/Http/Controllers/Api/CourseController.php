<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\User;
use App\Support\LmsSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function publicIndex(Request $request): JsonResponse
    {
        $courses = Course::query()
            ->where('status', 'published')
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(function ($inner) use ($request): void {
                    $search = '%' . $request->string('search')->toString() . '%';
                    $inner->where('title', 'like', $search)
                        ->orWhere('category', 'like', $search)
                        ->orWhere('level', 'like', $search);
                })
            )
            ->with('modules.lessons.completedUsers:id,name')
            ->orderBy('title')
            ->paginate($this->perPage($request, 12));

        return response()->json([
            'data' => $courses->getCollection()->map(fn (Course $course): array => LmsSupport::serializeCourse($course))->all(),
            'meta' => [
                'currentPage' => $courses->currentPage(),
                'lastPage' => $courses->lastPage(),
                'perPage' => $courses->perPage(),
                'total' => $courses->total(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $courses = Course::query()
            ->where('tenant_id', $user->tenant_id)
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(function ($inner) use ($request): void {
                    $search = '%' . $request->string('search')->toString() . '%';
                    $inner->where('title', 'like', $search)
                        ->orWhere('category', 'like', $search)
                        ->orWhere('level', 'like', $search);
                })
            )
            ->with('modules.lessons.completedUsers:id,name')
            ->orderBy('title')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $courses->getCollection()->map(fn (Course $course): array => LmsSupport::serializeCourse($course, $user))->all(),
            'meta' => [
                'currentPage' => $courses->currentPage(),
                'lastPage' => $courses->lastPage(),
                'perPage' => $courses->perPage(),
                'total' => $courses->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'level' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:draft,published'],
            'teacher_id' => ['nullable', 'exists:users,id'],
        ]);

        $teacherId = $validated['teacher_id'] ?? ($user->role === 'teacher' ? $user->id : null);

        $course = Course::query()->create([
            'tenant_id' => $user->tenant_id,
            'teacher_id' => $teacherId,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title'] . '-' . now()->timestamp),
            'category' => $validated['category'],
            'description' => $validated['description'],
            'price_bdt' => (int) ($validated['price'] ?? 0),
            'price' => $validated['price'] ?? 0,
            'level' => $validated['level'] ?? 'Beginner',
            'status' => $validated['status'] ?? 'draft',
            'published_at' => ($validated['status'] ?? 'draft') === 'published' ? now() : null,
            'thumbnail_url' => 'https://cdn.example.com/thumbnails/' . Str::slug($validated['title']) . '.jpg',
            'enrollment_count' => 0,
        ]);

        LmsSupport::audit($user, 'Created course', $course->title, $request->ip());

        return response()->json([
            'message' => 'Course created successfully.',
            'data' => LmsSupport::serializeCourse($course->load('modules.lessons.completedUsers:id,name'), $user),
        ], 201);
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        $user = $this->userFromRequest($request);
        $this->guardTenantCourse($user, $course);

        return response()->json([
            'data' => LmsSupport::serializeCourse($course->load('modules.lessons.completedUsers:id,name'), $user),
        ]);
    }

    public function publish(Request $request, Course $course): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->guardTenantCourse($user, $course);

        $course->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        LmsSupport::audit($user, 'Published course', $course->title, $request->ip());
        LmsSupport::notify($user->tenant, 'Teacher', 'system', sprintf('Course "%s" was published.', $course->title));
        LmsSupport::notify($user->tenant, 'Student', 'system', sprintf('New course "%s" is now available.', $course->title));

        return response()->json([
            'message' => 'Course published successfully.',
            'data' => LmsSupport::serializeCourse($course->fresh()->load('modules.lessons.completedUsers:id,name'), $user),
        ]);
    }

    public function storeModule(Request $request, Course $course): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->guardTenantCourse($user, $course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'drip_days' => ['nullable', 'integer', 'min:0'],
        ]);

        $module = $course->modules()->create([
            'title' => $validated['title'],
            'drip_days' => $validated['drip_days'] ?? 0,
            'position' => (int) $course->modules()->count() + 1,
        ]);

        LmsSupport::audit($user, 'Added course module', $module->title, $request->ip());

        return response()->json([
            'message' => 'Module created successfully.',
            'data' => LmsSupport::serializeModule($module->load('lessons.completedUsers:id,name'), $user),
        ], 201);
    }

    public function storeLesson(Request $request, Course $course, CourseModule $module): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->guardTenantCourse($user, $course);
        abort_if($module->course_id !== $course->id, 404, 'Module not found for this course.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:video,document,quiz,assignment,live'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'release_at' => ['nullable', 'date'],
        ]);

        $lesson = $module->lessons()->create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'duration_minutes' => $validated['duration_minutes'] ?? 0,
            'release_at' => $validated['release_at'] ?? now()->addDays($module->drip_days),
            'position' => (int) $module->lessons()->count() + 1,
        ]);

        LmsSupport::audit($user, 'Added lesson', $lesson->title, $request->ip());

        return response()->json([
            'message' => 'Lesson created successfully.',
            'data' => LmsSupport::serializeLesson($lesson->load('completedUsers:id,name'), $user),
        ], 201);
    }

    public function completeLesson(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['student']);
        $this->guardTenantCourse($user, $course);
        abort_if($lesson->module?->course_id !== $course->id, 404, 'Lesson not found for this course.');

        $lesson->completedUsers()->syncWithoutDetaching([
            $user->id => ['completed_at' => now()],
        ]);

        $this->syncComplianceProgress($user, $course);
        LmsSupport::audit($user, 'Completed lesson', $lesson->title, $request->ip());

        return response()->json([
            'message' => 'Lesson marked as completed.',
            'data' => LmsSupport::serializeLesson($lesson->fresh()->load('completedUsers:id,name'), $user),
        ]);
    }

    public function uploadLessonContent(Request $request, Course $course, CourseModule $module, Lesson $lesson): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->guardTenantCourse($user, $course);
        abort_if($module->course_id !== $course->id || $lesson->course_module_id !== $module->id, 404, 'Lesson not found for this course.');

        $validated = $request->validate([
            'content' => ['required', 'file', 'mimes:pdf,mp4,docx,jpg,jpeg,png,webp', 'max:51200'],
        ]);

        $file = $validated['content'];
        $path = $file->store('lesson-content/' . $course->id, 'public');

        $lesson->update([
            'content_url' => Storage::disk('public')->url($path),
            'content_mime' => $file->getMimeType(),
            'content_original_name' => $file->getClientOriginalName(),
        ]);

        LmsSupport::audit($user, 'Uploaded lesson content', $lesson->title, $request->ip());

        return response()->json([
            'message' => 'Lesson content uploaded successfully.',
            'data' => LmsSupport::serializeLesson($lesson->fresh()->load('completedUsers:id,name'), $user),
        ], 201);
    }

    private function userFromRequest(Request $request): User
    {
        /** @var User $user */
        $user = $request->user()->loadMissing('tenant');

        return $user;
    }

    private function guardTenantCourse(User $user, Course $course): void
    {
        abort_if($course->tenant_id !== $user->tenant_id, 404, 'Course not found.');
    }

    private function syncComplianceProgress(User $user, Course $course): void
    {
        if ($user->role !== 'student') {
            return;
        }

        $course->loadMissing('modules.lessons');

        $totalLessons = $course->modules->flatMap->lessons->count();

        if ($totalLessons === 0) {
            return;
        }

        $completedLessons = $course->modules
            ->flatMap->lessons
            ->filter(fn (Lesson $lesson): bool => $lesson->completedUsers()->where('users.id', $user->id)->exists())
            ->count();

        $completionPercent = (int) round(($completedLessons / $totalLessons) * 100);

        $course->complianceRecords()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'tenant_id' => $user->tenant_id,
                'employee_name' => $user->name,
                'department' => $user->department ?? 'General',
                'role_title' => ucfirst($user->role),
                'course_title' => $course->title,
                'completion_percent' => $completionPercent,
                'certified' => $completionPercent >= 100,
            ]
        );

        if ($completionPercent >= 100) {
            $certificate = Certificate::query()->firstOrNew([
                'user_id' => $user->id,
                'course_id' => $course->id,
            ]);

            $wasRecentlyIssued = !$certificate->exists;

            $certificate->fill([
                'course_title' => $course->title,
                'certificate_number' => $certificate->certificate_number ?: LmsSupport::certificateNumber($user->id, $course->id),
                'issued_at' => $certificate->issued_at ?: now(),
                'verification_code' => $certificate->verification_code ?: LmsSupport::verificationCode(),
                'status' => 'active',
                'revoked' => false,
                'revoked_at' => null,
            ]);
            $certificate->save();

            if ($wasRecentlyIssued) {
                LmsSupport::notify($user->tenant, 'Student', 'system', sprintf('Certificate issued for "%s".', $course->title));
            }
        }
    }
}
