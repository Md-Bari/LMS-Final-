<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LiveClass;
use Database\Seeders\Support\BangladeshLmsDataset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class LiveClassSeeder extends Seeder
{
    public function run(): void
    {
        Course::query()
            ->with(['tenant', 'teacher', 'enrollments'])
            ->where('status', 'published')
            ->orderBy('id')
            ->get()
            ->each(function (Course $course, int $courseIndex): void {
                $sessionCount = (($courseIndex + $course->tenant_id) % 2) + 1;

                for ($sessionIndex = 0; $sessionIndex < $sessionCount; $sessionIndex++) {
                    $status = $sessionIndex === 0
                        ? 'completed'
                        : ((($courseIndex + $sessionIndex) % 4 === 0) ? 'cancelled' : 'scheduled');

                    $liveClass = LiveClass::query()->updateOrCreate(
                        [
                            'course_id' => $course->id,
                            'title' => $course->title . ' Live Session ' . ($sessionIndex + 1),
                        ],
                        [
                            'tenant_id' => $course->tenant_id,
                            'teacher_id' => $course->teacher_id,
                            'created_by' => $course->teacher_id,
                            'meeting_link' => BangladeshLmsDataset::meetingUrl($course->tenant->subdomain, Str::slug($course->title), $sessionIndex),
                            'meeting_url' => BangladeshLmsDataset::meetingUrl($course->tenant->subdomain, Str::slug($course->title), $sessionIndex),
                            'recording_url' => $status === 'completed'
                                ? BangladeshLmsDataset::recordingUrl($course->tenant->subdomain, Str::slug($course->title), $sessionIndex)
                                : null,
                            'start_time' => Carbon::now()->subDays(($courseIndex + 1) * 2)->addDays($sessionIndex + 1),
                            'scheduled_at' => Carbon::now()->subDays(($courseIndex + 1) * 2)->addDays($sessionIndex + 1),
                            'start_at' => Carbon::now()->subDays(($courseIndex + 1) * 2)->addDays($sessionIndex + 1),
                            'duration_minutes' => 60 + (($courseIndex + $sessionIndex) % 30),
                            'participant_limit' => 50 + (($courseIndex * 5) % 150),
                            'platform' => 'jitsi',
                            'provider' => 'Jitsi',
                            'reminder_24h' => true,
                            'reminder_1h' => true,
                            'status' => $status,
                        ]
                    );

                    $this->seedAttendance($liveClass, $course->enrollments);
                }
            });
    }

    private function seedAttendance(LiveClass $liveClass, $enrollments): void
    {
        $eligible = $enrollments
            ->whereIn('status', ['active', 'completed'])
            ->take(12)
            ->values();

        foreach ($eligible as $index => $enrollment) {
            $attendanceStatus = match (($index + $liveClass->id) % 5) {
                0, 1, 2 => 'present',
                3 => 'late',
                default => 'absent',
            };

            Attendance::query()->updateOrCreate(
                [
                    'live_class_id' => $liveClass->id,
                    'student_id' => $enrollment->student_id,
                ],
                [
                    'status' => $attendanceStatus,
                    'joined_at' => $attendanceStatus === 'absent'
                        ? null
                        : Carbon::parse($liveClass->start_at)->addMinutes(($index % 3) * 5),
                ]
            );
        }
    }
}
