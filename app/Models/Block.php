<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'name',
        'bay_start',
        'bay_end',
        'row_start',
        'row_end',
        'max_tier',
        'facility',
        'road_side',
        'excluded_rows',
        'is_active',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'bay_start' => 'integer',
        'bay_end' => 'integer',
        'max_tier' => 'integer',
        'is_active' => 'boolean',
    ];

    public const FACILITIES = [
        'Terminal',
        'ECD',
    ];

    public function getTotalBaysAttribute(): int
    {
        return $this->bay_end - $this->bay_start + 1;
    }

    public function getTotalRowsAttribute(): int
    {
        $rows = [];
        for ($char = ord($this->row_start); $char <= ord($this->row_end); $char++) {
            $rows[] = chr($char);
        }

        return count($rows);
    }

    public function getTotalCapacityAttribute(): int
    {
        return $this->total_bays * $this->total_rows * $this->max_tier;
    }

    /**
     * @param  Builder<Block>  $query
     * @return Builder<Block>
     */
    public function scopeByFacility(Builder $query, string $facility): Builder
    {
        return $query->where('facility', $facility);
    }

    /**
     * @param  Builder<Block>  $query
     * @return Builder<Block>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Block>  $query
     * @return Builder<Block>
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'like', "%{$term}%");
    }
}
