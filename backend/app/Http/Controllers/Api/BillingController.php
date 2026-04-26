<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillingProfile;
use App\Models\Invoice;
use App\Models\User;
use App\Support\LmsSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BillingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin'])->loadMissing('tenant.billingProfile');

        return response()->json([
            'data' => LmsSupport::serializeBilling($user->tenant?->billingProfile),
            'plans' => LmsSupport::plans(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $this->authorizeRoles($request, ['admin']);
        $user->loadMissing('tenant');

        abort_if($user->tenant === null, 404, 'Tenant not found.');

        $validated = $request->validate([
            'plan' => ['required', 'in:Starter,Growth,Professional'],
            'active_students' => ['nullable', 'integer', 'min:0'],
        ]);

        $selectedPlan = LmsSupport::plans()[$validated['plan']];

        $billingProfile = BillingProfile::query()->updateOrCreate(
            ['tenant_id' => $user->tenant_id],
            [
                'plan' => $validated['plan'],
                'active_students' => $validated['active_students'] ?? ($user->tenant->billingProfile?->active_students ?? 0),
                'used_seats' => $validated['active_students'] ?? ($user->tenant->billingProfile?->used_seats ?? 0),
                'monthly_price' => $selectedPlan['price'],
                'seat_limit' => $selectedPlan['seat_limit'],
                'overage_per_seat' => $selectedPlan['overage_per_seat'],
                'billing_status' => 'paid',
                'next_billing_at' => now()->addMonth()->startOfMonth(),
            ]
        );

        $seatUtilization = (int) min(100, round((($billingProfile->used_seats ?: $billingProfile->active_students) / max(1, $billingProfile->seat_limit)) * 100));

        if ($seatUtilization >= 100) {
            LmsSupport::notify($user->tenant, 'Admin', 'billing', 'Seat utilization reached 100% of the active plan.');
        } elseif ($seatUtilization >= 80) {
            LmsSupport::notify($user->tenant, 'Admin', 'billing', 'Seat utilization crossed 80% of the active plan.');
        }

        $issuedAt = now();

        Invoice::query()->create([
            'tenant_id' => $user->tenant_id,
            'billing_profile_id' => $billingProfile->id,
            'invoice_number' => sprintf(
                'INV-%s-%s-%s',
                $issuedAt->format('Ym'),
                str_pad((string) $billingProfile->tenant_id, 4, '0', STR_PAD_LEFT),
                Str::upper((string) Str::ulid()),
            ),
            'amount_bdt' => $billingProfile->monthly_price,
            'billing_period' => $issuedAt->format('F Y'),
            'issued_at' => $issuedAt,
            'due_at' => $issuedAt->copy()->addDays(10),
            'paid_at' => $issuedAt,
            'payment_status' => 'paid',
        ]);

        LmsSupport::audit($user, 'Updated billing plan', $validated['plan'], $request->ip());
        LmsSupport::notify($user->tenant, 'Admin', 'billing', sprintf('Billing plan switched to %s.', $validated['plan']));

        return response()->json([
            'message' => 'Billing profile updated successfully.',
            'data' => LmsSupport::serializeBilling($billingProfile),
        ]);
    }
}
