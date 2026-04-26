<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class LiveClass extends Model
{
    protected $fillable = [
        'tenant_id',
        'course_id',
        'teacher_id',
        'created_by',
        'title',
        'description',
        'room_slug',
        'meeting_link',
        'meeting_url',
        'recording_url',
        'start_time',
        'scheduled_at',
        'start_at',
        'duration_minutes',
        'participant_limit',
        'platform',
        'provider',
        'reminder_24h',
        'reminder_1h',
        'reminder_24h_sent',
        'reminder_1h_sent',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'scheduled_at' => 'datetime',
            'start_at' => 'datetime',
            'reminder_24h' => 'boolean',
            'reminder_1h' => 'boolean',
            'reminder_24h_sent' => 'boolean',
            'reminder_1h_sent' => 'boolean',
        ];
    }

    protected function scheduledAt(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? $this->asDateTime($value) : $this->start_at,
            set: fn ($value) => [
                'scheduled_at' => $value,
                'start_at' => $value,
            ],
        );
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(LiveClassParticipant::class);
    }

    public function recordings(): HasMany
    {
        return $this->hasMany(LiveClassRecording::class);
    }
}
