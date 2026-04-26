<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketingEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketingEventController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'max:120'],
            'target' => ['nullable', 'string', 'max:180'],
            'path' => ['nullable', 'string', 'max:255'],
            'session_id' => ['nullable', 'string', 'max:120'],
            'metadata' => ['nullable', 'array'],
        ]);

        $event = MarketingEvent::query()->create([
            'action' => $validated['action'],
            'target' => $validated['target'] ?? null,
            'path' => $validated['path'] ?? null,
            'session_id' => $validated['session_id'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->headers->get('referer'),
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json([
            'message' => 'Event tracked.',
            'data' => [
                'id' => $event->id,
                'action' => $event->action,
                'target' => $event->target,
            ],
        ], 201);
    }
}

