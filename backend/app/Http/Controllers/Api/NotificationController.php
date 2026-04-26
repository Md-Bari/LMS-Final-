<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use App\Support\LmsSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $allowedAudiences = $this->allowedAudiencesForRole($user->role);

        $notifications = Notification::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereIn('audience', $allowedAudiences)
            ->when($request->filled('audience'), fn ($query) => $query->where('audience', $request->string('audience')->toString()))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')->toString()))
            ->latest()
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $notifications->getCollection()->map(fn (Notification $notification): array => LmsSupport::serializeNotification($notification))->all(),
            'meta' => [
                'currentPage' => $notifications->currentPage(),
                'lastPage' => $notifications->lastPage(),
                'perPage' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1500'],
            'type' => ['nullable', 'string', 'max:50'],
        ]);

        $notification = Notification::create([
            'tenant_id' => $user->tenant_id,
            'title' => 'Smart LMS Notification',
            'audience' => in_array($user->role, ['admin', 'teacher'], true) ? 'All' : 'Student',
            'type' => $validated['type'] ?? 'system',
            'message' => $validated['message'],
            'is_read' => false,
            'sent_at' => now(),
        ]);

        return response()->json([
            'data' => LmsSupport::serializeNotification($notification),
            'message' => 'Notification sent successfully.',
        ], 201);
    }

    private function allowedAudiencesForRole(string $role): array
    {
        return match ($role) {
            'teacher' => ['Teacher', 'All'],
            'student' => ['Student', 'All'],
            default => ['Admin', 'All'],
        };
    }
}
