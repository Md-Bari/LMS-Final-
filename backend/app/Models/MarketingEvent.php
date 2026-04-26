<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingEvent extends Model
{
    protected $fillable = [
        'action',
        'target',
        'path',
        'session_id',
        'ip_address',
        'user_agent',
        'referrer',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }
}

