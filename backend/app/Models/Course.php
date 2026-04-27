<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        'tenant_id',
        'teacher_id',
        'title',
        'slug',
        'category',
        'description',
        'what_you_will_learn',
        'requirements',
        'target_audience',
        'price_bdt',
        'status',
        'price',
        'level',
        'published_at',
        'thumbnail_url',
        'enrollment_count',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'price_bdt' => 'integer',
            'published_at' => 'datetime',
            'what_you_will_learn' => 'array',
            'requirements' => 'array',
            'target_audience' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function liveClasses(): HasMany
    {
        return $this->hasMany(LiveClass::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function complianceRecords(): HasMany
    {
        return $this->hasMany(ComplianceRecord::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }
}
