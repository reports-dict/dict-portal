<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Allocation extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'service',
        'discharge_port',
        'iso_basic_length',
        'reefer_type',
        'location',
    ];
}
