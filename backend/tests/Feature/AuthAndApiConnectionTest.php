<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Invoice;
use App\Models\User;
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
}
