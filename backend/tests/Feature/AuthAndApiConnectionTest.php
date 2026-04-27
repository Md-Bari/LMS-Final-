<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AuthAndApiConnectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_seeded_admin_can_log_in_and_receive_bootstrap_payload(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'message',
                'token',
                'access_token',
                'role',
                'tenant_id',
                'user' => ['id', 'tenantId', 'name', 'role', 'email'],
                'branding',
                'bootstrap' => [
                    'branding',
                    'users',
                    'courses',
                    'assessments',
                    'liveClasses',
                    'certificates',
                    'notifications',
                    'auditEvents',
                    'billing',
                    'currentUser',
                ],
            ]);

        $this->assertNotEmpty($response->json('token'));
        $this->assertSame($response->json('token'), $response->json('access_token'));
        $this->assertSame('admin', $response->json('role'));
        $this->assertSame('admin@example.com', $response->json('user.email'));
    }

    public function test_authenticated_user_can_fetch_profile_and_bootstrap_from_database(): void
    {
        $user = User::query()->where('email', 'teacher@example.com')->firstOrFail();

        $profileResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $profileResponse
            ->assertOk()
            ->assertJsonPath('data.user.email', 'teacher@example.com');

        $bootstrapResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/bootstrap');

        $bootstrapResponse
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'branding',
                    'users',
                    'courses',
                    'assessments',
                    'submissions',
                    'liveClasses',
                    'enrollments',
                    'certificates',
                    'notifications',
                    'billing',
                    'currentUser',
                ],
            ]);

        $this->assertSame('teacher@example.com', $bootstrapResponse->json('data.currentUser.email'));
        $this->assertIsArray($bootstrapResponse->json('data.courses'));
    }

    public function test_teacher_can_create_course_and_course_is_returned_from_index(): void
    {
        $teacher = User::query()->where('email', 'teacher@example.com')->firstOrFail();

        $createResponse = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/v1/courses', [
                'title' => 'Database Connected Course',
                'category' => 'QA',
                'description' => 'Course created through the API and stored in the database.',
                'price' => 499,
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.title', 'Database Connected Course')
            ->assertJsonPath('data.teacherId', $teacher->id);

        $courseId = $createResponse->json('data.id');

        $this->assertDatabaseHas('courses', [
            'id' => (int) $courseId,
            'tenant_id' => $teacher->tenant_id,
            'title' => 'Database Connected Course',
        ]);

        $indexResponse = $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/v1/courses');

        $indexResponse->assertOk();

        $courseTitles = collect($indexResponse->json('data'))->pluck('title')->all();

        $this->assertContains('Database Connected Course', $courseTitles);
        $this->assertGreaterThanOrEqual(
            Course::query()->where('tenant_id', $teacher->tenant_id)->count(),
            $indexResponse->json('meta.total')
        );
    }

    public function test_repeated_billing_updates_generate_unique_invoice_numbers(): void
    {
        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

        Carbon::setTestNow(Carbon::parse('2026-04-26 10:00:00'));

        try {
            $firstResponse = $this->actingAs($admin, 'sanctum')
                ->patchJson('/api/v1/billing', [
                    'plan' => 'Growth',
                    'active_students' => 430,
                ]);

            $secondResponse = $this->actingAs($admin, 'sanctum')
                ->patchJson('/api/v1/billing', [
                    'plan' => 'Growth',
                    'active_students' => 431,
                ]);
        } finally {
            Carbon::setTestNow();
        }

        $firstResponse->assertOk();
        $secondResponse->assertOk();

        $invoiceNumbers = Invoice::query()
            ->where('tenant_id', $admin->tenant_id)
            ->latest('id')
            ->take(2)
            ->pluck('invoice_number');

        $this->assertCount(2, $invoiceNumbers);
        $this->assertCount(2, $invoiceNumbers->unique());
    }

    public function test_student_can_add_and_remove_course_wishlist_item(): void
    {
        $student = User::query()->where('email', 'student@example.com')->firstOrFail();
        $course = Course::query()
            ->where('tenant_id', $student->tenant_id)
            ->where('status', 'published')
            ->firstOrFail();

        $addResponse = $this->actingAs($student, 'sanctum')
            ->postJson('/api/v1/wishlists', [
                'course_id' => $course->id,
            ]);

        $addResponse
            ->assertCreated()
            ->assertJsonPath('data.courseId', $course->id)
            ->assertJsonPath('data.studentId', $student->id);

        $this->assertDatabaseHas('wishlists', [
            'tenant_id' => $student->tenant_id,
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);

        $removeResponse = $this->actingAs($student, 'sanctum')
            ->deleteJson("/api/v1/wishlists/{$course->id}");

        $removeResponse->assertOk();

        $this->assertDatabaseMissing('wishlists', [
            'tenant_id' => $student->tenant_id,
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);
    }

    public function test_student_can_self_enroll_in_published_course(): void
    {
        $student = User::query()->where('email', 'student@example.com')->firstOrFail();
        $course = Course::query()
            ->where('tenant_id', $student->tenant_id)
            ->where('status', 'published')
            ->firstOrFail();

        Wishlist::query()->create([
            'tenant_id' => $student->tenant_id,
            'course_id' => $course->id,
            'student_id' => $student->id,
            'added_at' => now(),
        ]);

        $response = $this->actingAs($student, 'sanctum')
            ->postJson('/api/v1/enrollments', [
                'course_id' => $course->id,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.courseId', $course->id)
            ->assertJsonPath('data.studentId', $student->id)
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('enrollments', [
            'tenant_id' => $student->tenant_id,
            'course_id' => $course->id,
            'student_id' => $student->id,
            'status' => 'active',
        ]);
    }
}
