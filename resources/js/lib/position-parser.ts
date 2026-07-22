/**
 * Parses container positions in format: "B{block}{bay}{row}{tier}"
 * Example: "B0707F1" = Block 07, Bay 07, Row F, Tier 1
 */

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const MAX_TIERS = 5;

export type ParsedPosition = {
    block: string;
    bay: number;
    row: string;
    tier: number;
};

export function parsePosition(
    position: string | null | undefined,
): ParsedPosition | null {
    if (!position) {
        return null;
    }

    try {
        // Format: B{block}{bay}{row}{tier}, e.g. B0707F1
        if (position.length < 6) {
            console.warn(`Invalid position format: ${position}`);

            return null;
        }

        const prefix = position[0]; // 'B'
        const block = prefix + position.substring(1, 3); // 'B07'
        const bay = parseInt(position.substring(3, 5), 10); // 07
        const row = position[5]; // 'F'
        const tier = parseInt(position.substring(6), 10); // 1

        if (
            prefix !== 'B' ||
            isNaN(bay) ||
            isNaN(tier) ||
            !ROWS.includes(row)
        ) {
            console.warn(`Invalid position components: ${position}`);

            return null;
        }

        return { block, bay, row, tier };
    } catch (error) {
        console.warn(`Error parsing position "${position}":`, error);

        return null;
    }
}
