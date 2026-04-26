<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LiveClass;
use App\Models\LiveClassParticipant;
use App\Models\LiveClassRecording;
use App\Models\User;
use App\Support\LmsSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LiveClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = $this->visibleLiveClassesQuery($user)
            ->with(['course:id,tenant_id,title', 'teacher:id,name', 'participants', 'recordings'])
            ->latest('start_time')
            ->latest('scheduled_at');

        return response()->json([
            'success' => true,
            'data' => $query->get()->map(fn (LiveClass $liveClass): array => LmsSupport::serializeLiveClass($liveClass))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_time' => ['nullable', 'date', 'after:now', 'required_without:scheduled_at'],
            'scheduled_at' => ['nullable', 'date', 'after:now', 'required_without:start_time'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:300'],
            'platform' => ['nullable', 'string', 'max:50'],
            'meeting_link' => ['nullable', 'url'],
            'status' => ['nullable', 'in:scheduled,live,completed,recorded,cancelled'],
        ]);

        $course = Course::query()->findOrFail($validated['course_id']);
        abort_if($course->tenant_id !== $user->tenant_id, 404, 'Course not found.');

        $teacher = $this->resolveTeacher($user, $course, $validated['teacher_id'] ?? null);
        $startTime = $validated['start_time'] ?? $validated['scheduled_at'];
        $meetingLink = $this->resolveMeetingLink($validated['meeting_link'] ?? null, $validated['title']);
        $platform = $this->resolvePlatform($validated['platform'] ?? null, $meetingLink);
        $roomSlug = $this->extractRoomSlug($meetingLink, $validated['title']);

        $liveClass = LiveClass::query()->create([
            'tenant_id' => $user->tenant_id,
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'platform' => $platform,
            'provider' => $this->providerLabelFromPlatform($platform),
            'room_slug' => $roomSlug,
            'meeting_link' => $meetingLink,
            'meeting_url' => $meetingLink,
            'start_time' => $startTime,
            'scheduled_at' => $startTime,
            'start_at' => $startTime,
            'duration_minutes' => $validated['duration_minutes'],
            'participant_limit' => max(1, $course->enrollments()->count()),
            'reminder_24h' => true,
            'reminder_1h' => true,
            'reminder_24h_sent' => false,
            'reminder_1h_sent' => false,
            'status' => $validated['status'] ?? 'scheduled',
        ]);

        $liveClass->load(['course:id,tenant_id,title', 'teacher:id,name', 'participants', 'recordings']);

        LmsSupport::audit($user, 'Scheduled live class', $liveClass->title, $request->ip());
        LmsSupport::notify($user->tenant, 'Student', 'live-class', sprintf('Live class "%s" has been scheduled.', $liveClass->title));

        return response()->json([
            'success' => true,
            'message' => 'Live class scheduled successfully.',
            'data' => LmsSupport::serializeLiveClass($liveClass),
        ], 201);
    }

    public function show(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();
        $this->authorizeVisibleLiveClass($user, $liveClass);

        return response()->json([
            'success' => true,
            'data' => LmsSupport::serializeLiveClass($liveClass->load(['course:id,tenant_id,title', 'teacher:id,name', 'participants', 'recordings'])),
        ]);
    }

    public function update(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->authorizeManageLiveClass($user, $liveClass);

        $validated = $request->validate([
            'course_id' => ['sometimes', 'required', 'exists:courses,id'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_time' => ['nullable', 'date'],
            'scheduled_at' => ['nullable', 'date'],
            'duration_minutes' => ['sometimes', 'required', 'integer', 'min:15', 'max:300'],
            'platform' => ['nullable', 'string', 'max:50'],
            'meeting_link' => ['nullable', 'url'],
            'status' => ['nullable', 'in:scheduled,live,completed,recorded,cancelled'],
        ]);

        $course = $liveClass->course;

        if (array_key_exists('course_id', $validated)) {
            $course = Course::query()->findOrFail($validated['course_id']);
            abort_if($course->tenant_id !== $user->tenant_id, 404, 'Course not found.');
            $liveClass->course_id = $course->id;
            $liveClass->tenant_id = $course->tenant_id;
        }

        if (array_key_exists('teacher_id', $validated)) {
            $teacher = $this->resolveTeacher($user, $course, $validated['teacher_id']);
            $liveClass->teacher_id = $teacher->id;
        }

        if ($user->role === 'teacher') {
            $liveClass->teacher_id = $user->id;
        }

        if (array_key_exists('title', $validated)) {
            $liveClass->title = $validated['title'];
        }

        if (array_key_exists('description', $validated)) {
            $liveClass->description = $validated['description'];
        }

        if (array_key_exists('duration_minutes', $validated)) {
            $liveClass->duration_minutes = $validated['duration_minutes'];
        }

        if (array_key_exists('status', $validated)) {
            $liveClass->status = $validated['status'];
        }

        $startTime = $validated['start_time'] ?? $validated['scheduled_at'] ?? null;
        if ($startTime !== null) {
            $liveClass->start_time = $startTime;
            $liveClass->scheduled_at = $startTime;
            $liveClass->start_at = $startTime;
        }

        if (array_key_exists('meeting_link', $validated)) {
            $liveClass->meeting_link = $this->resolveMeetingLink($validated['meeting_link'], $liveClass->title);
            $liveClass->meeting_url = $liveClass->meeting_link;
            $liveClass->room_slug = $this->extractRoomSlug($liveClass->meeting_link, $liveClass->title);
        }

        if (array_key_exists('platform', $validated) || array_key_exists('meeting_link', $validated)) {
            $platform = $this->resolvePlatform($validated['platform'] ?? $liveClass->platform, $liveClass->meeting_link);
            $liveClass->platform = $platform;
            $liveClass->provider = $this->providerLabelFromPlatform($platform);
        }

        $liveClass->save();

        return response()->json([
            'success' => true,
            'message' => 'Live class updated successfully.',
            'data' => LmsSupport::serializeLiveClass($liveClass->fresh()->load(['course:id,tenant_id,title', 'teacher:id,name', 'participants', 'recordings'])),
        ]);
    }

    public function destroy(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->authorizeManageLiveClass($user, $liveClass);

        $title = $liveClass->title;
        $liveClass->delete();

        return response()->json([
            'success' => true,
            'message' => sprintf('Live class "%s" deleted successfully.', $title),
        ]);
    }

    public function goLive(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->authorizeManageLiveClass($user, $liveClass);

        $liveClass->update([
            'status' => 'live',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Live class is now live.',
            'data' => LmsSupport::serializeLiveClass($liveClass->fresh()->load(['participants', 'recordings'])),
        ]);
    }

    public function complete(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->authorizeManageLiveClass($user, $liveClass);

        $liveClass->update([
            'status' => 'completed',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Live class completed.',
            'data' => LmsSupport::serializeLiveClass($liveClass->fresh()->load(['participants', 'recordings'])),
        ]);
    }

    public function markRecorded(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->authorizeManageLiveClass($user, $liveClass);

        $validated = $request->validate([
            'recording_url' => ['nullable', 'url'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $recording = LiveClassRecording::query()->create([
            'tenant_id' => $liveClass->tenant_id,
            'live_class_id' => $liveClass->id,
            'recording_url' => $validated['recording_url'] ?? $liveClass->recording_url ?? $liveClass->meeting_link ?? $liveClass->meeting_url,
            'duration_seconds' => $validated['duration_seconds'] ?? ($liveClass->duration_minutes * 60),
            'duration' => $validated['duration_seconds'] ?? ($liveClass->duration_minutes * 60),
        ]);

        $liveClass->update([
            'recording_url' => $recording->recording_url,
            'status' => 'recorded',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Live class marked as recorded.',
            'data' => [
                'live_class' => LmsSupport::serializeLiveClass($liveClass->fresh()->load(['participants', 'recordings'])),
                'recording' => [
                    'id' => $recording->id,
                    'recordingUrl' => $recording->recording_url,
                    'durationSeconds' => $recording->duration_seconds,
                ],
            ],
        ]);
    }

    public function join(Request $request, LiveClass $liveClass): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorizeVisibleLiveClass($user, $liveClass);

        if ($user->role !== 'student') {
            return response()->json([
                'message' => 'Only students can join as participant.',
            ], 403);
        }

        $isEnrolled = Enrollment::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('student_id', $user->id)
            ->where('course_id', $liveClass->course_id)
            ->exists();

        abort_if(! $isEnrolled, 403, 'You are not enrolled in this course.');

        $participant = LiveClassParticipant::query()->updateOrCreate(
            [
                'tenant_id' => $user->tenant_id,
                'live_class_id' => $liveClass->id,
                'student_id' => $user->id,
            ],
            [
                'joined_at' => now(),
                'left_at' => null,
            ]
        );

        Attendance::query()->updateOrCreate(
            [
                'live_class_id' => $liveClass->id,
                'student_id' => $user->id,
            ],
            [
                'status' => 'present',
                'joined_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'meeting_url' => $liveClass->meeting_link ?? $liveClass->meeting_url,
            'data' => [
                'id' => $participant->id,
                'studentId' => $participant->student_id,
                'joinedAt' => optional($participant->joined_at)->toIso8601String(),
                'leftAt' => optional($participant->left_at)->toIso8601String(),
            ],
        ]);
    }

    public function leave(Request $request, LiveClass $liveClass): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorizeVisibleLiveClass($user, $liveClass);

        $participant = LiveClassParticipant::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('live_class_id', $liveClass->id)
            ->where('student_id', $user->id)
            ->firstOrFail();

        $participant->update([
            'left_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Student left the live class.',
        ]);
    }

    public function updateStatus(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        $this->authorizeManageLiveClass($user, $liveClass);

        $validated = $request->validate([
            'status' => ['required', 'in:scheduled,live,completed,recorded,cancelled'],
            'recording_url' => ['nullable', 'url'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validated['status'] === 'live') {
            return $this->goLive($request, $liveClass);
        }

        if ($validated['status'] === 'completed') {
            return $this->complete($request, $liveClass);
        }

        if ($validated['status'] === 'recorded') {
            return $this->markRecorded($request, $liveClass);
        }

        $liveClass->update([
            'status' => $validated['status'],
            'recording_url' => $validated['recording_url'] ?? $liveClass->recording_url,
        ]);

        LmsSupport::audit($user, 'Updated live class status', $liveClass->title, $request->ip());

        return response()->json([
            'success' => true,
            'message' => 'Live class status updated successfully.',
            'data' => LmsSupport::serializeLiveClass($liveClass->fresh()->load(['participants', 'recordings'])),
        ]);
    }

    private function visibleLiveClassesQuery(User $user)
    {
        $query = LiveClass::query()
            ->where('tenant_id', $user->tenant_id);

        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        }

        if ($user->role === 'student') {
            $courseIds = Enrollment::query()
                ->where('tenant_id', $user->tenant_id)
                ->where('student_id', $user->id)
                ->pluck('course_id');

            $query->whereIn('course_id', $courseIds);
        }

        return $query;
    }

    private function authorizeVisibleLiveClass(User $user, LiveClass $liveClass): void
    {
        abort_if($liveClass->tenant_id !== $user->tenant_id, 403, 'Invalid tenant access.');

        if ($user->role === 'teacher') {
            abort_if($liveClass->teacher_id !== $user->id, 403, 'You cannot access this live class.');
        }

        if ($user->role === 'student') {
            $isEnrolled = Enrollment::query()
                ->where('tenant_id', $user->tenant_id)
                ->where('student_id', $user->id)
                ->where('course_id', $liveClass->course_id)
                ->exists();

            abort_if(! $isEnrolled, 403, 'You cannot access this live class.');
        }
    }

    private function authorizeManageLiveClass(User $user, LiveClass $liveClass): void
    {
        abort_if($liveClass->tenant_id !== $user->tenant_id, 403, 'Invalid tenant access.');

        if ($user->role === 'teacher') {
            abort_if($liveClass->teacher_id !== $user->id, 403, 'You cannot manage this live class.');
        }
    }

    private function resolveTeacher(User $actor, Course $course, int|string|null $teacherId): User
    {
        if ($actor->role === 'teacher') {
            return $actor;
        }

        $resolvedTeacherId = $teacherId ?? $course->teacher_id ?? $actor->id;
        $teacher = User::query()->findOrFail($resolvedTeacherId);

        abort_if($teacher->tenant_id !== $actor->tenant_id, 403, 'Assigned teacher must belong to your tenant.');
        abort_if(! in_array($teacher->role, ['teacher', 'admin'], true), 422, 'Assigned user must be a teacher or admin.');

        return $teacher;
    }

    private function resolveMeetingLink(?string $meetingLink, string $title): string
    {
        $normalized = trim((string) $meetingLink);

        if ($normalized === '') {
            return $this->generateJitsiLink($title);
        }

        if (! str_starts_with(strtolower($normalized), 'https://')) {
            abort(422, 'The meeting link must be a valid HTTPS URL.');
        }

        return $normalized;
    }

    private function resolvePlatform(?string $platform, string $meetingLink): string
    {
        $normalized = strtolower(trim((string) $platform));

        if ($normalized !== '') {
            return str_replace(' ', '-', $normalized);
        }

        $host = strtolower((string) parse_url($meetingLink, PHP_URL_HOST));

        if (str_contains($host, 'meet.google.com')) {
            return 'google-meet';
        }

        if (str_contains($host, 'zoom.us')) {
            return 'zoom';
        }

        if (str_contains($host, 'meet.jit.si') || str_contains($host, 'jitsi')) {
            return 'jitsi';
        }

        if (str_contains($host, 'teams.microsoft.com')) {
            return 'teams';
        }

        return 'custom';
    }

    private function providerLabelFromPlatform(string $platform): string
    {
        return match ($platform) {
            'google-meet' => 'Google Meet',
            'zoom' => 'Zoom',
            'teams' => 'Teams',
            'jitsi' => 'Jitsi',
            default => ucfirst(str_replace('-', ' ', $platform)),
        };
    }

    private function extractRoomSlug(string $meetingLink, string $title): string
    {
        $path = trim((string) parse_url($meetingLink, PHP_URL_PATH), '/');
        $candidate = trim(Str::afterLast($path, '/'));

        if ($candidate !== '') {
            return Str::slug($candidate);
        }

        return Str::slug($title) . '-' . Str::lower(Str::random(6));
    }

    private function generateJitsiLink(string $title): string
    {
        $slug = Str::slug($title ?: 'live-class') . '-' . Str::lower(Str::random(6));
        return 'https://meet.jit.si/' . $slug;
    }
}
