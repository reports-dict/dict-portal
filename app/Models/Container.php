<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Container extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'container',
        'category',
        'iso_type',
        'position',
        'time_in',
        'notes',
        'dwell_days',
        'line_op',
        'transit_state',
        'condition',
        'pod',
        'pod_place_name',
        'pol',
        'pol_place_name',
        'outbound_carrier_id',
        'outbound_carrier_name',
        'inbound_carrier_id',
        'inbound_carrier_name',
        'shipper',
        'consignee',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'time_in' => 'datetime',
    ];

    public const CATEGORIES = [
        'Import',
        'Export',
        'Storage',
        'Transship',
    ];

    public const ISO_TYPES = [
        '20ft',
        '40ft',
    ];

    public const CONDITIONS = [
        'Good',
        'Fair',
        'Poor',
        'Unknown',
    ];

    public const TRANSIT_STATES = [
        'Loaded',
        'Empty',
        'Damaged',
    ];

    /** @return array{block: string, bay: string|null, row: string|null, tier: string|null} */
    public function getPositionComponents(): array
    {
        // Expected format: "BLOCK-BAY-ROW-TIER"
        $parts = explode('-', $this->position);

        return [
            'block' => $parts[0],
            'bay' => $parts[1] ?? null,
            'row' => $parts[2] ?? null,
            'tier' => $parts[3] ?? null,
        ];
    }

    /**
     * @param  Builder<Container>  $query
     * @return Builder<Container>
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * @param  Builder<Container>  $query
     * @return Builder<Container>
     */
    public function scopeByBlock(Builder $query, string $block): Builder
    {
        return $query->where('position', 'like', "{$block}%");
    }

    /**
     * @param  Builder<Container>  $query
     * @return Builder<Container>
     */
    public function scopeByLineOp(Builder $query, string $lineOp): Builder
    {
        return $query->where('line_op', $lineOp);
    }

    /**
     * @param  Builder<Container>  $query
     * @return Builder<Container>
     */
    public function scopeByDwellDays(Builder $query, int $minDays, ?int $maxDays = null): Builder
    {
        if ($maxDays !== null) {
            return $query->whereBetween('dwell_days', [$minDays, $maxDays]);
        }

        return $query->where('dwell_days', '>=', $minDays);
    }

    /**
     * @param  Builder<Container>  $query
     * @return Builder<Container>
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('container', 'like', "%{$term}%")
            ->orWhere('shipper', 'like', "%{$term}%");
    }

    /** @return Attribute<bool, never> */
    protected function requiresPower(): Attribute
    {
        return Attribute::make(
            get: fn (mixed $value): bool => $value !== null && (bool) ((int) $value),
        );
    }

    /** @return Attribute<bool, never> */
    protected function isPowered(): Attribute
    {
        return Attribute::make(
            get: fn (mixed $value): bool => $value !== null && (bool) ((int) $value),
        );
    }
}
