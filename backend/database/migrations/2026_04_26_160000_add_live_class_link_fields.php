<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_classes', function (Blueprint $table) {
            if (! Schema::hasColumn('live_classes', 'meeting_link')) {
                $table->string('meeting_link', 2048)->nullable()->after('meeting_url');
            }

            if (! Schema::hasColumn('live_classes', 'platform')) {
                $table->string('platform', 50)->default('jitsi')->after('provider');
            }

            if (! Schema::hasColumn('live_classes', 'start_time')) {
                $table->timestamp('start_time')->nullable()->after('scheduled_at');
            }

            if (! Schema::hasColumn('live_classes', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('teacher_id')->constrained('users')->nullOnDelete();
            }
        });

        if (! Schema::hasColumn('live_classes', 'meeting_link')) {
            return;
        }

        $liveClasses = DB::table('live_classes')->select([
            'id',
            'title',
            'meeting_url',
            'meeting_link',
            'room_slug',
            'provider',
            'platform',
            'scheduled_at',
            'start_at',
            'start_time',
            'teacher_id',
            'created_by',
        ])->get();

        foreach ($liveClasses as $liveClass) {
            $meetingLink = $liveClass->meeting_link ?: $liveClass->meeting_url;

            if (empty($meetingLink)) {
                $slug = $liveClass->room_slug ?: Str::slug((string) ($liveClass->title ?: 'live-class')) . '-' . Str::lower(Str::random(6));
                $meetingLink = 'https://meet.jit.si/' . $slug;
            }

            $platform = strtolower((string) ($liveClass->platform ?: $liveClass->provider ?: 'jitsi'));
            $platform = str_contains($platform, ' ') ? str_replace(' ', '-', $platform) : $platform;

            DB::table('live_classes')
                ->where('id', $liveClass->id)
                ->update([
                    'meeting_link' => $meetingLink,
                    'platform' => $platform ?: 'jitsi',
                    'start_time' => $liveClass->start_time ?? $liveClass->scheduled_at ?? $liveClass->start_at,
                    'created_by' => $liveClass->created_by ?? $liveClass->teacher_id,
                ]);
        }

        Schema::table('live_classes', function (Blueprint $table) {
            $table->index(['tenant_id', 'course_id']);
            $table->index(['tenant_id', 'teacher_id']);
            $table->index(['tenant_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::table('live_classes', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'course_id']);
            $table->dropIndex(['tenant_id', 'teacher_id']);
            $table->dropIndex(['tenant_id', 'start_time']);

            if (Schema::hasColumn('live_classes', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            $columns = array_filter([
                Schema::hasColumn('live_classes', 'meeting_link') ? 'meeting_link' : null,
                Schema::hasColumn('live_classes', 'platform') ? 'platform' : null,
                Schema::hasColumn('live_classes', 'start_time') ? 'start_time' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
