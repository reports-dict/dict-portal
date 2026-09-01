<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Read-only view of dict-operations-suite's `vessel_schedules` table, on the
 * same shared `vessel_dashboard` database. Operations staff create/edit and
 * transition schedule status exclusively in that other application — this
 * model is never used to create, update, or delete rows here.
 */
class VesselSchedule extends Model
{
    protected $connection = 'mysql_vessel_dashboard';

    protected $guarded = [];

    protected $casts = [
        'etb' => 'datetime',
        'etd' => 'datetime',
        'estimated_moves' => 'integer',
        'loa_meters' => 'decimal:2',
        'on_dock_at' => 'datetime',
        'departed_at' => 'datetime',
    ];
}
