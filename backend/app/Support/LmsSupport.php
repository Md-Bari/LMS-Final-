<?php

namespace App\Support;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AuditEvent;
use App\Models\BillingProfile;
use App\Models\Certificate;
use App\Models\ComplianceRecord;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Lesson;
use App\Models\LiveClass;
use App\Models\Notification;
use App\Models\Attendance;
use App\Models\Submission;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LmsSupport
{
    private static ?array $notificationColumns = null;

    public static function plans(): array
    {
        return config('lms.plans', []);
    }

    public static function fallbackQuestionBanks(): array
    {
        return config('lms.fallback_question_banks', []);
    }

    public static function fallbackBank(?string $bankId): ?array
    {
        return collect(self::fallbackQuestionBanks())
            ->firstWhere('id', $bankId);
    }

    public static function resolveQuestionSource(?string $sourceText, ?string $fallbackBankId): array
    {
        $normalizedText = self::normalizeQuestionSourceText((string) $sourceText);

        if ($normalizedText !== '') {
            return [
                'generated_from' => 'Teacher note upload',
                'source_text' => $normalizedText,
            ];
        }

        $fallback = self::fallbackBank($fallbackBankId);

        if ($fallback !== null) {
            return [
                'generated_from' => $fallback['title'],
                'source_text' => $fallback['source_text'],
            ];
        }

        return [
            'generated_from' => 'Frontend fallback summary',
            'source_text' => 'Learning assessment tenant certificate compliance billing classroom workflow.',
        ];
    }

    public static function generateAiQuestions(string $sourceText, string $type, int $count): array
    {
        $normalizedText = self::normalizeQuestionSourceText($sourceText);
        $topics = self::extractQuestionTopics($normalizedText);
        $sentenceMap = self::buildTopicSentenceMap($normalizedText, $topics);
        $fallbackWords = count($topics) > 0 ? $topics : ['learning', 'assessment', 'tenant', 'certificate'];
        $safeCount = max(1, min(50, $count));

        $questions = [];

        for ($index = 0; $index < $safeCount; $index++) {
            $keyword = $fallbackWords[$index % count($fallbackWords)];
            $supportingSentence = $sentenceMap[$keyword] ?? 'the uploaded notes';

            if ($type === 'True/False') {
                $questions[] = [
                    'prompt' => sprintf('True or False: The uploaded notes explicitly discuss %s as part of the lesson material.', $keyword),
                    'options' => ['True', 'False'],
                    'answer' => 'True',
                ];

                continue;
            }

            if (in_array($type, ['Short Answer', 'Essay'], true)) {
                $questions[] = [
                    'prompt' => sprintf('Explain the role of %s in this context: %s', $keyword, self::clipSentence($supportingSentence, 140)),
                    'options' => ['Reflect', 'Summarize', 'Compare', 'Apply'],
                    'answer' => $keyword,
                ];

                continue;
            }

            $correctOption = self::buildChoiceFromSentence($keyword, $supportingSentence, true);
            $distractors = collect($fallbackWords)
                ->filter(fn (string $topic): bool => $topic !== $keyword)
                ->take(3)
                ->map(fn (string $topic): string => self::buildChoiceFromSentence($topic, $sentenceMap[$topic] ?? 'a related concept from the course', false))
                ->values()
                ->all();

            $genericDistractors = [
                'It is generally considered outside the scope of this topic.',
                'It only applies in legacy systems.',
                'It is a concept not mentioned in the notes.'
            ];
            
            while (count($distractors) < 3) {
                $distractors[] = array_pop($genericDistractors);
            }

            $options = collect([$correctOption, ...$distractors])
                ->take(4)
                ->shuffle()
                ->values()
                ->all();

            $questions[] = [
                'prompt' => sprintf('According to the uploaded notes, which statement best describes %s?', $keyword),
                'options' => $options,
                'answer' => $correctOption,
            ];
        }

        return $questions;
    }

    public static function rubricKeywordsFromSource(string $sourceText): array
    {
        return collect(self::extractQuestionTopics(self::normalizeQuestionSourceText($sourceText)))
            ->take(3)
            ->values()
            ->all();
    }

    private static function normalizeQuestionSourceText(string $sourceText): string
    {
        $normalized = str_replace(
            [
                'Frontend preview mode is active.',
                'When backend is implemented, this file should be sent to the upload endpoint for OCR/document parsing before AI question generation.',
            ],
            '',
            $sourceText
        );

        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? '';

        return trim($normalized);
    }

    private static function extractQuestionTopics(string $sourceText): array
    {
        $stopWords = [
            'about', 'above', 'after', 'again', 'along', 'also', 'among', 'because', 'before', 'being', 'below', 'between',
            'could', 'course', 'described', 'detail', 'does', 'each', 'from', 'have', 'having', 'into', 'learn', 'lesson',
            'material', 'more', 'notes', 'other', 'part', 'platforms', 'should', 'students', 'their', 'there', 'these', 'this',
            'those', 'through', 'topic', 'under', 'uploaded', 'using', 'with', 'within', 'workflow', 'would', 'covers'
        ];

        $phraseCandidates = collect(preg_split('/[,;\n]+/', Str::lower($sourceText), -1, PREG_SPLIT_NO_EMPTY))
            ->map(fn (string $fragment): string => self::sanitizeTopicPhrase($fragment, $stopWords))
            ->filter(fn (string $phrase): bool => $phrase !== '')
            ->unique()
            ->values();

        $cleanedText = preg_replace('/[^a-z0-9\s]/i', ' ', Str::lower($sourceText)) ?? '';
        $wordCandidates = collect(preg_split('/\s+/', $cleanedText, -1, PREG_SPLIT_NO_EMPTY))
            ->filter(fn (string $word): bool => strlen($word) > 4)
            ->reject(fn (string $word): bool => in_array($word, $stopWords, true))
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(8);

        return $phraseCandidates
            ->merge($wordCandidates)
            ->unique()
            ->take(8)
            ->values()
            ->all();
    }

    private static function buildTopicSentenceMap(string $sourceText, array $topics): array
    {
        $sentences = collect(preg_split('/(?<=[\.\!\?])\s+|\n+/', $sourceText, -1, PREG_SPLIT_NO_EMPTY))
            ->map(fn (string $sentence): string => trim($sentence))
            ->filter(fn (string $sentence): bool => strlen($sentence) >= 30)
            ->values();

        $map = [];

        foreach ($topics as $topic) {
            $match = $sentences->first(fn (string $sentence): bool => str_contains(Str::lower($sentence), Str::lower($topic)));
            $map[$topic] = $match ?? ($sentences->first() ?? 'the uploaded notes');
        }

        return $map;
    }

    private static function buildChoiceFromSentence(string $topic, string $sentence, bool $correct): string
    {
        $clipped = self::clipSentence($sentence, 86);

        if ($correct) {
            return sprintf('%s is described in the notes as: %s', Str::title($topic), $clipped);
        }

        return sprintf('%s is framed as: %s', Str::title($topic), $clipped);
    }

    private static function sanitizeTopicPhrase(string $fragment, array $stopWords): string
    {
        $fragment = preg_replace('/[^a-z0-9\s]/i', ' ', $fragment) ?? '';
        $fragment = preg_replace('/^.*?\b(covers|cover|includes|include|learns|learn|focuses|focus|discusses|discuss|teaches|teach)\b\s+/i', '', $fragment) ?? $fragment;
        $words = collect(preg_split('/\s+/', $fragment, -1, PREG_SPLIT_NO_EMPTY))
            ->reject(fn (string $word): bool => in_array($word, $stopWords, true))
            ->values();

        if ($words->isEmpty()) {
            return '';
        }

        $slice = $words->take(3)->implode(' ');

        if (strlen($slice) < 5) {
            return '';
        }

        return $slice;
    }

    private static function clipSentence(string $sentence, int $limit): string
    {
        $sentence = preg_replace('/\s+/', ' ', trim($sentence)) ?? '';

        return Str::finish(Str::limit($sentence, $limit, '...'), '');
    }

    public static function evaluateEssay(string $answerText, array $rubricKeywords): array
    {
        $normalizedAnswer = Str::lower($answerText);
        $keywordHits = collect($rubricKeywords)
            ->filter(fn (string $keyword): bool => Str::contains($normalizedAnswer, Str::lower($keyword)))
            ->count();

        $lengthScore = min(40, (int) round(strlen(trim($answerText)) / 8));
        $keywordScore = min(45, $keywordHits * 15);
        $clarityScore = str_contains($answerText, '.') ? 15 : 5;
        $score = max(35, min(100, $lengthScore + $keywordScore + $clarityScore));
        $passed = $score >= 70;

        return [
            'score' => $score,
            'passed' => $passed,
            'feedback' => $passed
                ? 'The submission addresses the rubric clearly, uses relevant terminology, and demonstrates enough depth to pass.'
                : 'The response needs more detail tied to the rubric. Mention the key concepts more directly and expand your explanation.',
        ];
    }

    public static function generateCsv(Collection $records): string
    {
        $header = 'Employee,Department,Role,Course,Completion %,Certified';

        $rows = $records->map(function (ComplianceRecord $record): string {
            return collect([
                $record->employee_name,
                $record->department,
                $record->role_title,
                $record->course_title,
                (string) $record->completion_percent,
                $record->certified ? 'Yes' : 'No',
            ])->map(function (string $value): string {
                return '"' . str_replace('"', '""', $value) . '"';
            })->implode(',');
        });

        return collect([$header])->concat($rows)->implode("\n");
    }

    public static function serializeBranding(Tenant $tenant): array
    {
        return [
            'tenantId' => $tenant->id,
            'vendorId' => $tenant->id,
            'tenantName' => $tenant->name,
            'vendorName' => $tenant->name,
            'subdomain' => $tenant->subdomain,
            'vendorSubdomain' => $tenant->subdomain,
            'city' => $tenant->city,
            'logoText' => $tenant->logo_text,
            'primaryColor' => $tenant->primary_color,
            'accentColor' => $tenant->accent_color,
            'supportEmail' => $tenant->support_email,
            'customDomain' => $tenant->custom_domain,
            'planType' => $tenant->plan_type,
            'status' => $tenant->status,
            'vendorStatus' => $tenant->status,
            'workspaceMode' => 'multi-vendor',
        ];
    }

    public static function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'tenantId' => $user->tenant_id,
            'vendorId' => $user->tenant_id,
            'name' => $user->name,
            'role' => $user->role,
            'email' => $user->email,
            'phone' => $user->phone,
            'department' => $user->department,
            'city' => $user->city,
            'profileImageUrl' => $user->profile_image_url,
            'bio' => $user->bio,
            'ratingAverage' => $user->rating_average !== null ? (float) $user->rating_average : null,
            'ratingCount' => $user->rating_count,
        ];
    }

    private static function normalizeCourseList(?array $items): array
    {
        if (! is_array($items) || $items === []) {
            return [];
        }

        return collect($items)
            ->map(fn ($item): string => trim((string) $item))
            ->filter(fn (string $item): bool => $item !== '')
            ->values()
            ->all();
    }

    public static function serializeLesson(Lesson $lesson, ?User $viewer = null): array
    {
        $lesson->loadMissing('completedUsers:id,name');

        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'type' => $lesson->type,
            'contentUrl' => $lesson->content_url,
            'contentMime' => $lesson->content_mime,
            'contentOriginalName' => $lesson->content_original_name,
            'durationMinutes' => $lesson->duration_minutes,
            'releaseAt' => optional($lesson->release_at)->toIso8601String(),
            'completedBy' => $lesson->completedUsers->pluck('name')->values()->all(),
            'isCompleted' => $viewer !== null
                ? $lesson->completedUsers->contains('id', $viewer->id)
                : false,
        ];
    }

    public static function serializeModule(CourseModule $module, ?User $viewer = null): array
    {
        $module->loadMissing('lessons.completedUsers:id,name');

        return [
            'id' => $module->id,
            'title' => $module->title,
            'dripDays' => $module->drip_days,
            'lessons' => $module->lessons
                ->sortBy('position')
                ->values()
                ->map(fn (Lesson $lesson): array => self::serializeLesson($lesson, $viewer))
                ->all(),
        ];
    }

    public static function serializeCourse(Course $course, ?User $viewer = null): array
    {
        $course->loadMissing('modules.lessons.completedUsers:id,name', 'teacher:id,name,email,department,city,profile_image_url,bio,rating_average,rating_count');

        $learnOutcomes = self::normalizeCourseList($course->what_you_will_learn);
        $requirements = self::normalizeCourseList($course->requirements);
        $targetAudience = self::normalizeCourseList($course->target_audience);
        $teacher = $course->teacher;
        $studentCount = (int) ($course->enrollments_count ?? $course->enrollment_count ?? 0);

        return [
            'id' => $course->id,
            'tenantId' => $course->tenant_id,
            'vendorId' => $course->tenant_id,
            'teacherId' => $course->teacher_id,
            'title' => $course->title,
            'category' => $course->category,
            'description' => $course->description,
            'status' => $course->status,
            'price' => (float) ($course->price_bdt ?? $course->price),
            'priceBdt' => (int) ($course->price_bdt ?? $course->price),
            'enrollmentCount' => $course->enrollments_count ?? $course->enrollment_count,
            'whatYouWillLearn' => $learnOutcomes,
            'requirements' => $requirements,
            'targetAudience' => $targetAudience,
            'instructor' => $teacher ? [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'profileImageUrl' => $teacher->profile_image_url,
                'bio' => $teacher->bio,
                'ratingAverage' => $teacher->rating_average !== null ? (float) $teacher->rating_average : null,
                'ratingCount' => (int) ($teacher->rating_count ?? 0),
                'studentsCount' => $studentCount,
            ] : null,
            'modules' => $course->modules
                ->sortBy('position')
                ->values()
                ->map(fn (CourseModule $module): array => self::serializeModule($module, $viewer))
                ->all(),
            'assessmentGateEnabled' => (bool) $course->assessment_gate_enabled,
        ];
    }

    public static function serializeAssessmentQuestion(AssessmentQuestion $question): array
    {
        return [
            'id' => $question->id,
            'prompt' => $question->prompt,
            'options' => $question->options ?? [],
            'answer' => $question->answer,
        ];
    }

    public static function serializeAssessment(Assessment $assessment): array
    {
        $assessment->loadMissing('questions', 'course:id,tenant_id');

        return [
            'id' => $assessment->id,
            'tenantId' => $assessment->course?->tenant_id,
            'vendorId' => $assessment->course?->tenant_id,
            'courseId' => $assessment->course_id,
            'title' => $assessment->title,
            'type' => $assessment->type,
            'status' => $assessment->status,
            'generatedFrom' => $assessment->generated_from,
            'aiGenerated' => $assessment->ai_generated,
            'questionCount' => $assessment->question_count,
            'passingMark' => $assessment->passing_mark,
            'totalMarks' => $assessment->total_marks,
            'questions' => $assessment->questions
                ->sortBy('position')
                ->values()
                ->map(fn (AssessmentQuestion $question): array => self::serializeAssessmentQuestion($question))
                ->all(),
            'rubricKeywords' => $assessment->rubric_keywords ?? [],
            'teacherReviewed' => $assessment->teacher_reviewed,
        ];
    }

    public static function serializeSubmission(Submission $submission): array
    {
        $submission->loadMissing('user:id,name');

        return [
            'id' => $submission->id,
            'assessmentId' => $submission->assessment_id,
            'studentName' => $submission->user?->name,
            'answerText' => $submission->answer_text,
            'status' => $submission->status,
            'score' => $submission->score,
            'feedback' => $submission->feedback,
            'aiFeedback' => $submission->ai_feedback,
            'teacherFeedback' => $submission->teacher_feedback,
            'passed' => $submission->passed,
            'submittedAt' => optional($submission->submitted_at)->toIso8601String(),
        ];
    }

    public static function serializeLiveClass(LiveClass $liveClass): array
    {
        $liveClass->loadMissing(['course:id,tenant_id', 'participants:id,live_class_id,student_id,joined_at,left_at', 'recordings:id,live_class_id,recording_url,duration_seconds,duration']);
        $scheduledAt = $liveClass->scheduled_at ?? $liveClass->start_at;
        $endsAt = $liveClass->ends_at
            ?? ($scheduledAt ? $scheduledAt->copy()->addMinutes((int) ($liveClass->duration_minutes ?? 0)) : null);
        $status = self::resolveLiveClassStatus($liveClass);
        $meetingType = strtolower((string) ($liveClass->meeting_type ?? $liveClass->provider ?? 'jitsi'));
        $meetingLink = $liveClass->meeting_link ?? $liveClass->meeting_url;
        $canJoin = self::canJoinLiveClass($liveClass);

        return [
            'id' => $liveClass->id,
            'tenantId' => $liveClass->tenant_id ?? $liveClass->course?->tenant_id,
            'vendorId' => $liveClass->tenant_id ?? $liveClass->course?->tenant_id,
            'batchName' => $liveClass->batch_name,
            'title' => $liveClass->title,
            'description' => $liveClass->description,
            'courseId' => $liveClass->course_id,
            'teacherId' => $liveClass->teacher_id,
            'roomSlug' => $liveClass->room_slug,
            'scheduledAt' => optional($scheduledAt)->toIso8601String(),
            'startAt' => optional($scheduledAt)->toIso8601String(),
            'endAt' => optional($endsAt)->toIso8601String(),
            'date' => optional($scheduledAt)->toDateString(),
            'startTime' => optional($scheduledAt)->format('H:i'),
            'endTime' => optional($endsAt)->format('H:i'),
            'durationMinutes' => $liveClass->duration_minutes,
            'participantLimit' => $liveClass->participant_limit,
            'participantCount' => $liveClass->participants->count(),
            'meetingType' => $meetingType,
            'provider' => ucfirst($meetingType),
            'meetingUrl' => $meetingLink,
            'meetingLink' => $meetingLink,
            'recordingUrl' => $liveClass->recording_url,
            'reminder24h' => $liveClass->reminder_24h,
            'reminder1h' => $liveClass->reminder_1h,
            'reminder24hSent' => $liveClass->reminder_24h_sent,
            'reminder1hSent' => $liveClass->reminder_1h_sent,
            'status' => $status,
            'canJoin' => $canJoin,
            'joinWindowStartsAt' => optional($scheduledAt?->copy()->subMinutes(15))->toIso8601String(),
            'joinWindowEndsAt' => optional($endsAt?->copy()->addMinutes(15))->toIso8601String(),
            'participants' => $liveClass->participants->map(fn ($participant): array => [
                'id' => $participant->id,
                'studentId' => $participant->student_id,
                'joinedAt' => optional($participant->joined_at)->toIso8601String(),
                'leftAt' => optional($participant->left_at)->toIso8601String(),
            ])->all(),
            'recordings' => $liveClass->recordings->map(fn ($recording): array => [
                'id' => $recording->id,
                'recordingUrl' => $recording->recording_url,
                'durationSeconds' => $recording->duration_seconds ?? $recording->duration,
            ])->all(),
        ];
    }

    public static function resolveLiveClassStatus(LiveClass $liveClass): string
    {
        if (in_array($liveClass->status, ['recorded', 'completed', 'cancelled'], true)) {
            return $liveClass->status;
        }

        $scheduledAt = $liveClass->scheduled_at ?? $liveClass->start_at;

        if ($scheduledAt === null) {
            return $liveClass->status;
        }

        $startsAt = $scheduledAt->copy();
        $endsAt = $startsAt->copy()->addMinutes((int) ($liveClass->duration_minutes ?? 0));

        if (now()->between($startsAt, $endsAt)) {
            return 'live';
        }

        return $liveClass->status;
    }

    public static function canJoinLiveClass(LiveClass $liveClass): bool
    {
        $scheduledAt = $liveClass->scheduled_at ?? $liveClass->start_at;

        if ($scheduledAt === null) {
            return false;
        }

        $endsAt = $liveClass->ends_at ?? $scheduledAt->copy()->addMinutes((int) ($liveClass->duration_minutes ?? 0));
        $windowStart = $scheduledAt->copy()->subMinutes(15);
        $windowEnd = $endsAt->copy()->addMinutes(15);

        return now()->betweenIncluded($windowStart, $windowEnd) && ! in_array($liveClass->status, ['cancelled', 'recorded'], true);
    }

    public static function serializeCertificate(Certificate $certificate): array
    {
        $certificate->loadMissing('user:id,name', 'course:id,tenant_id');

        return [
            'id' => $certificate->id,
            'tenantId' => $certificate->course?->tenant_id,
            'vendorId' => $certificate->course?->tenant_id,
            'studentName' => $certificate->user?->name,
            'courseId' => $certificate->course_id,
            'courseTitle' => $certificate->course_title,
            'certificateNumber' => $certificate->certificate_number,
            'issuedAt' => optional($certificate->issued_at)->toIso8601String(),
            'verificationCode' => $certificate->verification_code,
            'status' => $certificate->status,
            'revoked' => $certificate->revoked,
        ];
    }

    public static function serializeNotification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'tenantId' => $notification->tenant_id,
            'vendorId' => $notification->tenant_id,
            'userId' => $notification->user_id,
            'title' => $notification->title,
            'audience' => $notification->audience,
            'type' => $notification->type,
            'message' => $notification->message,
            'isRead' => $notification->is_read,
            'sentAt' => optional($notification->sent_at)->toIso8601String(),
            'createdAt' => optional($notification->created_at)->toIso8601String(),
        ];
    }

    public static function serializeAuditEvent(AuditEvent $auditEvent): array
    {
        return [
            'id' => $auditEvent->id,
            'tenantId' => $auditEvent->tenant_id,
            'vendorId' => $auditEvent->tenant_id,
            'actor' => $auditEvent->actor,
            'action' => $auditEvent->action,
            'target' => $auditEvent->target,
            'ipAddress' => $auditEvent->ip_address,
            'timestamp' => optional($auditEvent->created_at)->toIso8601String(),
        ];
    }

    public static function serializeComplianceRecord(ComplianceRecord $record): array
    {
        return [
            'id' => $record->id,
            'tenantId' => $record->tenant_id,
            'vendorId' => $record->tenant_id,
            'employeeName' => $record->employee_name,
            'department' => $record->department,
            'roleTitle' => $record->role_title,
            'courseId' => $record->course_id,
            'courseTitle' => $record->course_title,
            'completionPercent' => $record->completion_percent,
            'certified' => $record->certified,
        ];
    }

    public static function serializeBilling(?BillingProfile $billingProfile): array
    {
        if ($billingProfile === null) {
            return [
                'tenantId' => null,
                'vendorId' => null,
                'plan' => 'Starter',
                'activeStudents' => 0,
                'monthlyPrice' => 49,
                'seatLimit' => 100,
                'overagePerSeat' => 5,
                'seatUtilizationPercent' => 0,
                'overageAmount' => 0,
            ];
        }

        $seatUtilizationPercent = (int) min(
            100,
            round((($billingProfile->used_seats ?: $billingProfile->active_students) / max(1, $billingProfile->seat_limit)) * 100)
        );

        $seatBase = $billingProfile->used_seats ?: $billingProfile->active_students;
        $overageAmount = max(0, $seatBase - $billingProfile->seat_limit) * $billingProfile->overage_per_seat;

        return [
            'tenantId' => $billingProfile->tenant_id,
            'vendorId' => $billingProfile->tenant_id,
            'plan' => $billingProfile->plan,
            'activeStudents' => $billingProfile->used_seats ?: $billingProfile->active_students,
            'monthlyPrice' => $billingProfile->monthly_price,
            'seatLimit' => $billingProfile->seat_limit,
            'overagePerSeat' => $billingProfile->overage_per_seat,
            'seatUtilizationPercent' => $seatUtilizationPercent,
            'overageAmount' => $overageAmount,
            'billingStatus' => $billingProfile->billing_status,
            'nextBillingAt' => optional($billingProfile->next_billing_at)->toIso8601String(),
        ];
    }

    public static function serializeEnrollment(Enrollment $enrollment): array
    {
        $enrollment->loadMissing('student:id,name', 'course:id,title');

        return [
            'id' => $enrollment->id,
            'tenantId' => $enrollment->tenant_id,
            'vendorId' => $enrollment->tenant_id,
            'courseId' => $enrollment->course_id,
            'courseTitle' => $enrollment->course?->title,
            'studentId' => $enrollment->student_id,
            'studentName' => $enrollment->student?->name,
            'status' => $enrollment->status,
            'progressPercentage' => $enrollment->progress_percentage,
            'enrolledAt' => optional($enrollment->enrolled_at)->toIso8601String(),
            'completedAt' => optional($enrollment->completed_at)->toIso8601String(),
        ];
    }

    public static function serializeWishlist(Wishlist $wishlist): array
    {
        $wishlist->loadMissing('student:id,name', 'course:id,title');

        return [
            'id' => $wishlist->id,
            'tenantId' => $wishlist->tenant_id,
            'vendorId' => $wishlist->tenant_id,
            'courseId' => $wishlist->course_id,
            'courseTitle' => $wishlist->course?->title,
            'studentId' => $wishlist->student_id,
            'studentName' => $wishlist->student?->name,
            'addedAt' => optional($wishlist->added_at)->toIso8601String(),
        ];
    }

    public static function serializeAttendance(Attendance $attendance): array
    {
        $attendance->loadMissing('student:id,name', 'liveClass:id,title');

        return [
            'id' => $attendance->id,
            'liveClassId' => $attendance->live_class_id,
            'liveClassTitle' => $attendance->liveClass?->title,
            'studentId' => $attendance->student_id,
            'studentName' => $attendance->student?->name,
            'status' => $attendance->status,
            'joinedAt' => optional($attendance->joined_at)->toIso8601String(),
        ];
    }

    public static function serializeInvoice(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'tenantId' => $invoice->tenant_id,
            'vendorId' => $invoice->tenant_id,
            'billingProfileId' => $invoice->billing_profile_id,
            'invoiceNumber' => $invoice->invoice_number,
            'amountBdt' => $invoice->amount_bdt,
            'billingPeriod' => $invoice->billing_period,
            'issuedAt' => optional($invoice->issued_at)->toIso8601String(),
            'dueAt' => optional($invoice->due_at)->toIso8601String(),
            'paidAt' => optional($invoice->paid_at)->toIso8601String(),
            'paymentStatus' => $invoice->payment_status,
        ];
    }

    public static function serializeVendorSummary(Tenant $tenant): array
    {
        $tenant->loadMissing('users:id,tenant_id,is_active', 'courses:id,tenant_id,status', 'billingProfile:id,tenant_id,active_students,used_seats');

        $activeUsers = $tenant->users->where('is_active', true)->count();
        $publishedCourses = $tenant->courses->where('status', 'published')->count();
        $activeStudents = $tenant->billingProfile?->used_seats ?: $tenant->billingProfile?->active_students ?: 0;

        return [
            'id' => $tenant->id,
            'tenantId' => $tenant->id,
            'vendorId' => $tenant->id,
            'tenantName' => $tenant->name,
            'vendorName' => $tenant->name,
            'subdomain' => $tenant->subdomain,
            'vendorSubdomain' => $tenant->subdomain,
            'city' => $tenant->city,
            'planType' => $tenant->plan_type,
            'status' => $tenant->status,
            'vendorStatus' => $tenant->status,
            'supportEmail' => $tenant->support_email,
            'customDomain' => $tenant->custom_domain,
            'activeUsers' => $activeUsers,
            'publishedCourses' => $publishedCourses,
            'activeStudents' => $activeStudents,
        ];
    }

    public static function audit(User $actor, string $action, string $target, ?string $ipAddress = null): AuditEvent
    {
        return AuditEvent::create([
            'tenant_id' => $actor->tenant_id,
            'actor' => $actor->name,
            'action' => $action,
            'target' => $target,
            'ip_address' => $ipAddress,
        ]);
    }

    public static function notify(?Tenant $tenant, string $audience, string $type, string $message): Notification
    {
        $payload = [
            'tenant_id' => $tenant?->id,
            'audience' => $audience,
            'type' => $type,
            'message' => $message,
        ];

        if (self::notificationHasColumn('title')) {
            $payload['title'] = 'Smart LMS Notification';
        }

        if (self::notificationHasColumn('is_read')) {
            $payload['is_read'] = false;
        }

        if (self::notificationHasColumn('sent_at')) {
            $payload['sent_at'] = now();
        }

        return Notification::create($payload);
    }

    public static function notificationHasColumn(string $column): bool
    {
        if (self::$notificationColumns === null) {
            self::$notificationColumns = Schema::getColumnListing('notifications');
        }

        return in_array($column, self::$notificationColumns, true);
    }

    public static function verificationCode(): string
    {
        return strtoupper('BETO-' . Str::random(4) . '-' . Str::random(4));
    }

    public static function certificateNumber(int|string $userId, int|string $courseId): string
    {
        return sprintf(
            'CERT-%s-%s-%s',
            now()->format('Ymd'),
            str_pad((string) $userId, 5, '0', STR_PAD_LEFT),
            str_pad((string) $courseId, 5, '0', STR_PAD_LEFT)
        );
    }

    public static function generateSimplePdf(string $title, array $lines): string
    {
        $safeTitle = str_replace(['(', ')'], ['[', ']'], $title);
        $contentLines = array_merge([$safeTitle], [''], $lines);
        $y = 780;
        $textCommands = ['BT', '/F1 12 Tf', '50 800 Td'];

        foreach ($contentLines as $index => $line) {
            $safeLine = str_replace(['\\', '(', ')'], ['\\\\', '[', ']'], $line);

            if ($index === 0) {
                $textCommands[] = sprintf('(%s) Tj', $safeLine);
                $y -= 22;
                continue;
            }

            $textCommands[] = sprintf('1 0 0 1 50 %d Tm (%s) Tj', $y, $safeLine);
            $y -= 16;
        }

        $textCommands[] = 'ET';
        $stream = implode("\n", $textCommands);

        $objects = [];
        $objects[] = '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj';
        $objects[] = '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj';
        $objects[] = '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj';
        $objects[] = '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj';
        $objects[] = sprintf("5 0 obj << /Length %d >> stream\n%s\nendstream endobj", strlen($stream), $stream);

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        $pdf .= "trailer << /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    public static function bootstrapPayload(User $user): array
    {
        $tenant = Tenant::query()
            ->with([
                'users',
                'billingProfile',
                'courses.modules.lessons.completedUsers:id,name',
                'courses.enrollments.student:id,name',
                'courses.wishlists.student:id,name',
                'courses.assessments.questions',
                'courses.assessments.submissions.user:id,name',
                'courses.liveClasses.attendances.student:id,name',
                'courses.certificates.user:id,name',
                'notifications',
                'auditEvents',
                'complianceRecords',
                'invoices',
            ])
            ->findOrFail($user->tenant_id);

        $tenantCourses = $tenant->courses->values();
        $tenantAssessments = $tenantCourses
            ->flatMap(fn (Course $course) => $course->assessments)
            ->sortByDesc('created_at')
            ->values();
        $tenantSubmissions = $tenantAssessments
            ->flatMap(fn (Assessment $assessment) => $assessment->submissions)
            ->sortByDesc('submitted_at')
            ->values();
        $tenantLiveClasses = $tenantCourses
            ->flatMap(fn (Course $course) => $course->liveClasses)
            ->sortBy('start_at')
            ->values();
        $tenantEnrollments = $tenantCourses
            ->flatMap(fn (Course $course) => $course->enrollments)
            ->sortByDesc('enrolled_at')
            ->values();
        $tenantWishlists = $tenantCourses
            ->flatMap(fn (Course $course) => $course->wishlists)
            ->sortByDesc('added_at')
            ->values();
        $tenantAttendances = $tenantLiveClasses
            ->flatMap(fn (LiveClass $liveClass) => $liveClass->attendances)
            ->sortByDesc('created_at')
            ->values();
        $tenantCertificates = $tenantCourses
            ->flatMap(fn (Course $course) => $course->certificates)
            ->sortByDesc('issued_at')
            ->values();

        $visibleUsers = $tenant->users->sortBy('name')->values();
        $visibleCourses = $tenantCourses->sortBy('title')->values();
        $visibleAssessments = $tenantAssessments;
        $visibleSubmissions = $tenantSubmissions;
        $visibleLiveClasses = $tenantLiveClasses;
        $visibleEnrollments = $tenantEnrollments;
        $visibleWishlists = $tenantWishlists;
        $visibleAttendances = $tenantAttendances;
        $visibleCertificates = $tenantCertificates;
        $visibleNotifications = $tenant->notifications->sortByDesc('created_at')->values();
        $visibleAuditEvents = $tenant->auditEvents->sortByDesc('created_at')->values();
        $visibleComplianceRecords = $tenant->complianceRecords->sortBy('employee_name')->values();
        $visibleInvoices = $tenant->invoices->sortByDesc('issued_at')->values();
        $visibleBilling = self::serializeBilling($tenant->billingProfile);

        if ($user->role === 'teacher') {
            $teacherCourses = $tenantCourses
                ->where('teacher_id', $user->id)
                ->values();
            $teacherCourseIds = $teacherCourses->pluck('id')->all();
            $studentIds = $teacherCourses
                ->flatMap(fn (Course $course) => $course->enrollments)
                ->pluck('student_id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            $visibleUsers = $tenant->users
                ->filter(fn (User $tenantUser): bool => $tenantUser->id === $user->id || in_array($tenantUser->id, $studentIds, true))
                ->sortBy('name')
                ->values();
            $visibleCourses = $teacherCourses->sortBy('title')->values();
            $visibleAssessments = $tenantAssessments
                ->whereIn('course_id', $teacherCourseIds)
                ->values();
            $visibleSubmissions = $visibleAssessments
                ->flatMap(fn (Assessment $assessment) => $assessment->submissions)
                ->sortByDesc('submitted_at')
                ->values();
            $visibleLiveClasses = $tenantLiveClasses
                ->whereIn('course_id', $teacherCourseIds)
                ->values();
            $visibleEnrollments = $tenantEnrollments
                ->whereIn('course_id', $teacherCourseIds)
                ->values();
            $visibleWishlists = $tenantWishlists
                ->whereIn('course_id', $teacherCourseIds)
                ->values();
            $visibleAttendances = $visibleLiveClasses
                ->flatMap(fn (LiveClass $liveClass) => $liveClass->attendances)
                ->sortByDesc('created_at')
                ->values();
            $visibleCertificates = $tenantCertificates
                ->whereIn('course_id', $teacherCourseIds)
                ->values();
            $visibleNotifications = $tenant->notifications
                ->filter(fn (Notification $notification): bool => in_array($notification->audience, ['Teacher', 'All'], true))
                ->sortByDesc('created_at')
                ->values();
            $visibleAuditEvents = $tenant->auditEvents
                ->filter(fn (AuditEvent $auditEvent): bool => $auditEvent->actor === $user->name)
                ->sortByDesc('created_at')
                ->values();
            $visibleComplianceRecords = $tenant->complianceRecords
                ->whereIn('course_id', $teacherCourseIds)
                ->sortBy('employee_name')
                ->values();
            $visibleInvoices = collect();
            $visibleBilling = self::serializeBilling(null);
        } elseif ($user->role === 'student') {
            $studentEnrollments = $tenantEnrollments
                ->where('student_id', $user->id)
                ->values();
            $studentCourseIds = $studentEnrollments->pluck('course_id')->all();
            $studentCourses = $tenantCourses
                ->whereIn('id', $studentCourseIds)
                ->where('status', 'published')
                ->values();
            $studentAssessments = $tenantAssessments
                ->whereIn('course_id', $studentCourseIds)
                ->where('status', 'published')
                ->values();
            $studentLiveClasses = $tenantLiveClasses
                ->whereIn('course_id', $studentCourseIds)
                ->values();
            $studentCertificates = $tenantCertificates
                ->where('user_id', $user->id)
                ->values();
            $studentSubmissions = $tenantSubmissions
                ->where('user_id', $user->id)
                ->values();

            $visibleUsers = collect([$user]);
            $visibleCourses = $studentCourses->sortBy('title')->values();
            $visibleAssessments = $studentAssessments->sortByDesc('created_at')->values();
            $visibleSubmissions = $studentSubmissions->sortByDesc('submitted_at')->values();
            $visibleLiveClasses = $studentLiveClasses->sortBy('start_at')->values();
            $visibleEnrollments = $studentEnrollments->sortByDesc('enrolled_at')->values();
            $visibleWishlists = $tenantWishlists
                ->where('student_id', $user->id)
                ->sortByDesc('added_at')
                ->values();
            $visibleAttendances = $studentLiveClasses
                ->flatMap(fn (LiveClass $liveClass) => $liveClass->attendances)
                ->where('student_id', $user->id)
                ->sortByDesc('created_at')
                ->values();
            $visibleCertificates = $studentCertificates;
            $visibleNotifications = $tenant->notifications
                ->filter(fn (Notification $notification): bool => in_array($notification->audience, ['Student', 'All'], true))
                ->sortByDesc('created_at')
                ->values();
            $visibleAuditEvents = collect();
            $visibleComplianceRecords = $tenant->complianceRecords
                ->where('employee_name', $user->name)
                ->sortBy('employee_name')
                ->values();
            $visibleInvoices = collect();
            $visibleBilling = self::serializeBilling(null);
        }

        return [
            'branding' => self::serializeBranding($tenant),
            'users' => $visibleUsers
                ->map(fn (User $tenantUser): array => self::serializeUser($tenantUser))
                ->all(),
            'courses' => $visibleCourses
                ->map(fn (Course $course): array => self::serializeCourse($course, $user))
                ->all(),
            'assessments' => $visibleAssessments
                ->map(fn (Assessment $assessment): array => self::serializeAssessment($assessment))
                ->all(),
            'submissions' => $visibleSubmissions
                ->map(fn (Submission $submission): array => self::serializeSubmission($submission))
                ->all(),
            'liveClasses' => $visibleLiveClasses
                ->map(fn (LiveClass $liveClass): array => self::serializeLiveClass($liveClass))
                ->all(),
            'enrollments' => $visibleEnrollments
                ->map(fn (Enrollment $enrollment): array => self::serializeEnrollment($enrollment))
                ->all(),
            'wishlists' => $visibleWishlists
                ->map(fn (Wishlist $wishlist): array => self::serializeWishlist($wishlist))
                ->all(),
            'attendances' => $visibleAttendances
                ->map(fn (Attendance $attendance): array => self::serializeAttendance($attendance))
                ->all(),
            'certificates' => $visibleCertificates
                ->map(fn (Certificate $certificate): array => self::serializeCertificate($certificate))
                ->all(),
            'notifications' => $visibleNotifications
                ->map(fn (Notification $notification): array => self::serializeNotification($notification))
                ->all(),
            'auditEvents' => $visibleAuditEvents
                ->map(fn (AuditEvent $auditEvent): array => self::serializeAuditEvent($auditEvent))
                ->all(),
            'complianceRecords' => $visibleComplianceRecords
                ->map(fn (ComplianceRecord $record): array => self::serializeComplianceRecord($record))
                ->all(),
            'invoices' => $visibleInvoices
                ->map(fn (Invoice $invoice): array => self::serializeInvoice($invoice))
                ->all(),
            'billing' => $visibleBilling,
            'planMatrix' => self::plans(),
            'fallbackQuestionBank' => self::fallbackQuestionBanks(),
            'endpoints' => config('lms.endpoints'),
            'currentUser' => self::serializeUser($user),
        ];
    }
}
