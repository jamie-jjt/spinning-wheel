/**
 * weighted.js — Weighted random selection engine
 * Handles both weighted and equal-probability selection.
 */
const WeightedEngine = (() => {

    /**
     * Select a winner index based on segment weights.
     * @param {Array} segments - Array of { title, weight } objects
     * @param {boolean} useWeights - If true, use weight values; if false, equal probability
     * @returns {number} Index of the winning segment
     */
    function selectWinner(segments, useWeights) {
        if (!segments || segments.length === 0) return -1;
        if (segments.length === 1) return 0;

        if (!useWeights) {
            // Pure equal random
            return Math.floor(Math.random() * segments.length);
        }

        // Weighted selection using cumulative distribution
        const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
        if (totalWeight <= 0) {
            return Math.floor(Math.random() * segments.length);
        }

        const rand = Math.random() * totalWeight;
        let cumulative = 0;

        for (let i = 0; i < segments.length; i++) {
            cumulative += segments[i].weight;
            if (rand <= cumulative) {
                return i;
            }
        }

        // Fallback (shouldn't reach here)
        return segments.length - 1;
    }

    /**
     * Redistribute weights proportionally after removing a segment.
     * @param {Array} segments - Array of { title, weight } objects (after removal)
     * @returns {Array} Segments with redistributed weights summing to 100
     */
    function redistributeWeights(segments) {
        if (!segments || segments.length === 0) return [];

        const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
        if (totalWeight <= 0) {
            // Equal distribution if all weights are zero
            const equalWeight = 100 / segments.length;
            return segments.map(s => ({ ...s, weight: Math.round(equalWeight * 100) / 100 }));
        }

        const scale = 100 / totalWeight;
        let distributed = segments.map(s => ({
            ...s,
            weight: Math.round(s.weight * scale * 100) / 100
        }));

        // Fix rounding errors by adjusting the last segment
        const sum = distributed.reduce((acc, s) => acc + s.weight, 0);
        const diff = 100 - Math.round(sum * 100) / 100;
        if (diff !== 0 && distributed.length > 0) {
            distributed[distributed.length - 1].weight = 
                Math.round((distributed[distributed.length - 1].weight + diff) * 100) / 100;
        }

        return distributed;
    }

    /**
     * Calculate the target angle to land on a specific segment.
     * Wheel is divided into visually equal segments.
     * @param {number} winnerIndex - Index of the winning segment
     * @param {number} totalSegments - Total number of segments
     * @returns {number} Target angle in radians (where pointer at top = 0)
     */
    function calculateTargetAngle(winnerIndex, totalSegments) {
        const segmentAngle = (2 * Math.PI) / totalSegments;
        // Pointer is at top (12 o'clock = -PI/2 in standard math, but we draw from top)
        // The wheel rotates clockwise, pointer is fixed at top
        // Segment 0 starts at top-right, going clockwise
        // To land in the middle of segment i:
        const segmentMiddle = segmentAngle * winnerIndex + segmentAngle / 2;
        // The wheel needs to rotate so this segment is at the top (pointer position)
        // Add some randomness within the segment to avoid always hitting dead center
        const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.7;
        const targetAngle = segmentMiddle + randomOffset;
        return targetAngle;
    }

    return { selectWinner, redistributeWeights, calculateTargetAngle };
})();
