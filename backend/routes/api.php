<?php

use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\LiveClassController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TenantBrandingController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/public/courses', [CourseController::class, 'publicIndex']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/bootstrap', [BootstrapController::class, 'show']);

        Route::get('/tenant/branding', [TenantBrandingController::class, 'show']);
        Route::put('/tenant/branding', [TenantBrandingController::class, 'update']);
        Route::get('/vendor/branding', [TenantBrandingController::class, 'show']);
        Route::put('/vendor/branding', [TenantBrandingController::class, 'update']);
        Route::get('/vendors', [VendorController::class, 'index']);
        Route::get('/tenants', [VendorController::class, 'index']);
        Route::get('/vendors/current', [VendorController::class, 'current']);

        Route::get('/users', [DirectoryController::class, 'index']);
        Route::get('/users/{role}', [DirectoryController::class, 'byRole']);

        Route::get('/courses', [CourseController::class, 'index']);
        Route::post('/courses', [CourseController::class, 'store']);
        Route::get('/courses/{course}', [CourseController::class, 'show']);
        Route::post('/courses/{course}/publish', [CourseController::class, 'publish']);
        Route::post('/courses/{course}/modules', [CourseController::class, 'storeModule']);
        Route::post('/courses/{course}/modules/{module}/lessons', [CourseController::class, 'storeLesson']);
        Route::post('/courses/{course}/modules/{module}/lessons/{lesson}/content', [CourseController::class, 'uploadLessonContent']);
        Route::post('/courses/{course}/lessons/{lesson}/complete', [CourseController::class, 'completeLesson']);

        Route::get('/enrollments', [EnrollmentController::class, 'index']);
        Route::post('/enrollments', [EnrollmentController::class, 'store']);
        Route::patch('/enrollments/{enrollment}', [EnrollmentController::class, 'update']);
        Route::get('/wishlists', [WishlistController::class, 'index']);
        Route::post('/wishlists', [WishlistController::class, 'store']);
        Route::delete('/wishlists/{course}', [WishlistController::class, 'destroy']);

        Route::get('/assessments', [AssessmentController::class, 'index']);
        Route::post('/assessments/generate', [AssessmentController::class, 'generate']);
        Route::post('/assessments/{assessment}/publish', [AssessmentController::class, 'publish']);
        Route::post('/assessments/{assessment}/submit', [AssessmentController::class, 'submit']);
        Route::post('/teacher/notes/upload', [AssessmentController::class, 'uploadNotes']);
        Route::get('/teacher/question-bank/fallback', [AssessmentController::class, 'fallbackBanks']);
        Route::post('/teacher/assessments/generate', [AssessmentController::class, 'generate']);

        Route::get('/live-classes', [LiveClassController::class, 'index']);
        Route::post('/live-classes', [LiveClassController::class, 'store']);
        Route::get('/live-classes/{liveClass}', [LiveClassController::class, 'show']);
        Route::post('/live-classes/{liveClass}/go-live', [LiveClassController::class, 'goLive']);
        Route::post('/live-classes/{liveClass}/complete', [LiveClassController::class, 'complete']);
        Route::post('/live-classes/{liveClass}/mark-recorded', [LiveClassController::class, 'markRecorded']);
        Route::post('/live-classes/{liveClass}/join', [LiveClassController::class, 'join']);
        Route::post('/live-classes/{liveClass}/leave', [LiveClassController::class, 'leave']);
        Route::patch('/live-classes/{liveClass}/status', [LiveClassController::class, 'updateStatus']);
        Route::get('/live-classes/{liveClass}/attendance', [AttendanceController::class, 'index']);
        Route::post('/live-classes/{liveClass}/attendance', [AttendanceController::class, 'store']);

        Route::get('/reports/compliance', [ComplianceController::class, 'index']);
        Route::get('/reports/compliance/export/csv', [ComplianceController::class, 'exportCsv']);
        Route::get('/reports/compliance/export/pdf', [ComplianceController::class, 'exportPdf']);
        Route::post('/reports/compliance/reminders', [ComplianceController::class, 'sendReminders']);

        Route::post('/emails/send', [EmailController::class, 'send']);

        Route::get('/certificates', [CertificateController::class, 'index']);
        Route::post('/certificates', [CertificateController::class, 'store']);
        Route::post('/certificates/{certificate}/revoke', [CertificateController::class, 'revoke']);

        Route::get('/billing', [BillingController::class, 'show']);
        Route::patch('/billing', [BillingController::class, 'update']);
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/audit-events', [AuditController::class, 'index']);
    });
});

