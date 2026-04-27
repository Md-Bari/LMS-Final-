<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillingProfile;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Tenant;
use App\Models\User;
use App\Support\LmsSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $enrollments = Enrollment::query()
            ->where('tenant_id', $user->tenant_id)
            ->when($request->filled('course_id'), fn ($query) => $query->where('course_id', $request->integer('course_id')))
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->with(['course:id,title', 'student:id,name'])
            ->latest('enrolled_at')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $enrollments->getCollection()->map(fn (Enrollment $enrollment): array => LmsSupport::serializeEnrollment($enrollment))->all(),
            'meta' => [
                'currentPage' => $enrollments->currentPage(),
                'lastPage' => $enrollments->lastPage(),
                'perPage' => $enrollments->perPage(),
                'total' => $enrollments->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(in_array($user->role, ['admin', 'teacher', 'student'], true), 403, 'Forbidden.');

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'student_id' => [Rule::requiredIf($user->role !== 'student'), 'nullable', 'exists:users,id'],
            'status' => ['nullable', 'in:active,completed,pending,cancelled'],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'enrolled_at' => ['nullable', 'date'],
        ]);

        $course = Course::query()->findOrFail($validated['course_id']);
        $studentId = $user->role === 'student' ? $user->id : (int) $validated['student_id'];
        $student = User::query()->findOrFail($studentId);

        abort_if($course->tenant_id !== $user->tenant_id || $student->tenant_id !== $user->tenant_id, 404, 'Resource not found.');
        if ($user->role === 'student') {
            abort_if($course->status !== 'published', 422, 'Only published courses can be enrolled from catalog.');
        }

        $billingProfile = $this->resolveTenantBillingProfile($user->tenant_id);
        abort_if(
            in_array($billingProfile->billing_status, ['overdue', 'suspended', 'inactive', 'failed'], true),
            402,
            'Subscription is not active. Please renew your plan before enrolling students.'
        );

        $status = $user->role === 'student' ? 'active' : ($validated['status'] ?? 'active');
        $progress = $user->role === 'student'
            ? 0
            : ($validated['progress_percentage'] ?? ($status === 'completed' ? 100 : 0));

        $enrollment = Enrollment::query()->updateOrCreate(
            [
                'course_id' => $course->id,
                'student_id' => $student->id,
            ],
            [
                'tenant_id' => $user->tenant_id,
                'status' => $status,
                'progress_percentage' => $progress,
                'enrolled_at' => $validated['enrolled_at'] ?? now(),
                'completed_at' => $status === 'completed' ? now() : null,
            ]
        );

        $course->update([
            'enrollment_count' => Enrollment::query()
                ->where('course_id', $course->id)
                ->whereIn('status', ['active', 'completed', 'pending'])
                ->count(),
        ]);
        $this->syncSeatUsage($user->tenant_id, $billingProfile);

        LmsSupport::audit($user, 'Created enrollment', $course->title . ' / ' . $student->name, $request->ip());
        LmsSupport::notify($user->tenant, 'Student', 'system', sprintf('You have been enrolled in "%s".', $course->title));

        try {
            if ($student->email) {
                Mail::raw(
                    "Hello {$student->name},\n\nYou have been enrolled in the course '{$course->title}'.\n\nYou can now start your learning journey.",
                    function ($message) use ($student, $course) {
                        $message->to($student->email)->subject("Enrolled in {$course->title}");
                    }
                );
            }
        } catch (\Throwable $e) {
            // Ignore email failure
        }

        return response()->json([
            'message' => 'Enrollment created successfully.',
            'data' => LmsSupport::serializeEnrollment($enrollment->load(['course:id,title', 'student:id,name'])),
        ], 201);
    }

    public function update(Request $request, Enrollment $enrollment): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin', 'teacher']);
        abort_if($enrollment->tenant_id !== $user->tenant_id, 404, 'Enrollment not found.');

        $validated = $request->validate([
            'status' => ['nullable', 'in:active,completed,pending,cancelled'],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $status = $validated['status'] ?? $enrollment->status;
        $progress = $validated['progress_percentage'] ?? $enrollment->progress_percentage;

        $enrollment->update([
            'status' => $status,
            'progress_percentage' => $progress,
            'completed_at' => $status === 'completed' ? ($enrollment->completed_at ?? now()) : null,
        ]);
        $billingProfile = $this->resolveTenantBillingProfile($user->tenant_id);
        $this->syncSeatUsage($user->tenant_id, $billingProfile);

        if ($status === 'completed') {
            $enrollment->course?->complianceRecords()->updateOrCreate(
                ['user_id' => $enrollment->student_id],
                [
                    'tenant_id' => $enrollment->tenant_id,
                    'employee_name' => $enrollment->student?->name ?? 'Learner',
                    'department' => $enrollment->student?->department ?? 'General',
                    'role_title' => ucfirst($enrollment->student?->role ?? 'student'),
                    'course_title' => $enrollment->course?->title ?? 'Course',
                    'completion_percent' => $progress,
                    'certified' => true,
                ]
            );
        }

        LmsSupport::audit($user, 'Updated enrollment', (string) $enrollment->id, $request->ip());

        return response()->json([
            'message' => 'Enrollment updated successfully.',
            'data' => LmsSupport::serializeEnrollment($enrollment->fresh()->load(['course:id,title', 'student:id,name'])),
        ]);
    }

    private function resolveTenantBillingProfile(int $tenantId): BillingProfile
    {
        $tenant = Tenant::query()->findOrFail($tenantId);
        $planName = $tenant->plan_type ?: 'Starter';
        $plan = LmsSupport::plans()[$planName] ?? LmsSupport::plans()['Starter'];

        return BillingProfile::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'plan' => $planName,
                'active_students' => 0,
                'used_seats' => 0,
                'monthly_price' => $plan['price'],
                'seat_limit' => $plan['seat_limit'],
                'overage_per_seat' => $plan['overage_per_seat'],
                'billing_status' => 'paid',
                'next_billing_at' => now()->addMonth()->startOfMonth(),
            ]
        );
    }

    private function syncSeatUsage(int $tenantId, BillingProfile $billingProfile): void
    {
        $activeSeatCount = Enrollment::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['active', 'completed', 'pending'])
            ->distinct('student_id')
            ->count('student_id');

        $billingProfile->update([
            'active_students' => $activeSeatCount,
            'used_seats' => $activeSeatCount,
        ]);

        $seatLimit = max(1, (int) $billingProfile->seat_limit);
        $utilization = (int) round(($activeSeatCount / $seatLimit) * 100);

        if ($utilization >= 100) {
            LmsSupport::notify($billingProfile->tenant, 'Admin', 'billing', 'Seat utilization reached 100% of the active plan.');
        } elseif ($utilization >= 80) {
            LmsSupport::notify($billingProfile->tenant, 'Admin', 'billing', 'Seat utilization crossed 80% of the active plan.');
        }
    }
}
