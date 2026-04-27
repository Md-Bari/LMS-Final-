<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'profile_image_url')) {
                $table->string('profile_image_url')->nullable()->after('phone');
            }

            if (! Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable()->after('address');
            }

            if (! Schema::hasColumn('users', 'rating_average')) {
                $table->decimal('rating_average', 3, 2)->nullable()->after('bio');
            }

            if (! Schema::hasColumn('users', 'rating_count')) {
                $table->unsignedInteger('rating_count')->default(0)->after('rating_average');
            }
        });

        Schema::table('courses', function (Blueprint $table) {
            if (! Schema::hasColumn('courses', 'what_you_will_learn')) {
                $table->json('what_you_will_learn')->nullable()->after('description');
            }

            if (! Schema::hasColumn('courses', 'requirements')) {
                $table->json('requirements')->nullable()->after('what_you_will_learn');
            }

            if (! Schema::hasColumn('courses', 'target_audience')) {
                $table->json('target_audience')->nullable()->after('requirements');
            }
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('courses', 'what_you_will_learn')) {
                $columns[] = 'what_you_will_learn';
            }
            if (Schema::hasColumn('courses', 'requirements')) {
                $columns[] = 'requirements';
            }
            if (Schema::hasColumn('courses', 'target_audience')) {
                $columns[] = 'target_audience';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('users', 'profile_image_url')) {
                $columns[] = 'profile_image_url';
            }
            if (Schema::hasColumn('users', 'bio')) {
                $columns[] = 'bio';
            }
            if (Schema::hasColumn('users', 'rating_average')) {
                $columns[] = 'rating_average';
            }
            if (Schema::hasColumn('users', 'rating_count')) {
                $columns[] = 'rating_count';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
