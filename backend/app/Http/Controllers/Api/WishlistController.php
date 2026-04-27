<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Models\Wishlist;
use App\Support\LmsSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $wishlists = Wishlist::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('student_id', $user->id)
            ->with(['course:id,title,tenant_id', 'student:id,name'])
            ->latest('added_at')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $wishlists->getCollection()->map(fn (Wishlist $wishlist): array => LmsSupport::serializeWishlist($wishlist))->all(),
            'meta' => [
                'currentPage' => $wishlists->currentPage(),
                'lastPage' => $wishlists->lastPage(),
                'perPage' => $wishlists->perPage(),
                'total' => $wishlists->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['student']);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
        ]);

        $course = Course::query()->findOrFail($validated['course_id']);
        abort_if($course->tenant_id !== $user->tenant_id, 404, 'Course not found.');
        abort_if($course->status !== 'published', 422, 'Only published courses can be added to wishlist.');

        $wishlist = Wishlist::query()->updateOrCreate(
            [
                'tenant_id' => $user->tenant_id,
                'course_id' => $course->id,
                'student_id' => $user->id,
            ],
            [
                'added_at' => now(),
            ]
        );

        LmsSupport::audit($user, 'Added to wishlist', $course->title, $request->ip());

        return response()->json([
            'message' => 'Course added to wishlist.',
            'data' => LmsSupport::serializeWishlist($wishlist->load(['course:id,title,tenant_id', 'student:id,name'])),
        ], 201);
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['student']);
        abort_if($course->tenant_id !== $user->tenant_id, 404, 'Course not found.');

        Wishlist::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('student_id', $user->id)
            ->where('course_id', $course->id)
            ->delete();

        LmsSupport::audit($user, 'Removed from wishlist', $course->title, $request->ip());

        return response()->json([
            'message' => 'Course removed from wishlist.',
        ]);
    }
}
