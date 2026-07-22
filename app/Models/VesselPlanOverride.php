<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VesselPlanOverride extends Model
{
    protected $connection = 'mysql_vessel_dashboard';

    protected $primaryKey = 'ob_ib_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];
}
