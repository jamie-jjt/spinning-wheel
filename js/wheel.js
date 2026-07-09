/**
 * wheel.js — Canvas wheel rendering + spin animation
 * Renders equal-sized pastel segments and handles spin mechanics.
 */
const Wheel = (() => {
    let canvas, ctx;
    let segments = [];
    let currentRotation = 0; // Current rotation angle in radians
    let isSpinning = false;
    let animationId = null;

    // Spin animation state
    let spinStartTime = 0;
    let spinDuration = 0;
    let spinStartAngle = 0;
    let spinTotalAngle = 0;
    let lastTickSegment = -1;

    // Callback when spin completes
    let onSpinComplete = null;

    // Pastel palette for segments (cycles if more segments than colors)
    const PASTEL_COLORS = [
        '#FFB3C6', // pink
        '#C8B8E8', // lavender
        '#A8E6CF', // mint
        '#FFD6A5', // peach
        '#B5EAD7', // sage
        '#E2B4F0', // violet
        '#FFDAC1', // melon
        '#98D8E8', // sky blue
        '#F4C2C2', // baby pink
        '#C1E1C1', // tea green
        '#D4A5E5', // orchid
        '#FFF3B0', // cream
        '#B4D7E8', // powder blue
        '#F0B8D0', // carnation
        '#C8E8B0', // pistachio
        '#E8C8D8', // mauve
    ];

    function init() {
        canvas = document.getElementById('wheelCanvas');
        ctx = canvas.getContext('2d');
        handleResize();
        window.addEventListener('resize', handleResize);
    }

    function handleResize() {
        const container = canvas.parentElement;
        const size = Math.min(container.clientWidth, 680);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render();
    }

    /**
     * Update the segments data and re-render.
     * @param {Array} newSegments - Array of { title, weight }
     */
    function setSegments(newSegments) {
        segments = newSegments || [];
        render();
    }

    function getSegments() {
        return segments;
    }

    /**
     * Render the wheel onto the canvas.
     */
    function render() {
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const size = canvas.width / dpr;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 8;

        ctx.clearRect(0, 0, size, size);

        if (segments.length === 0) {
            // Draw empty wheel placeholder
            drawEmptyWheel(centerX, centerY, radius);
            return;
        }

        const segmentAngle = (2 * Math.PI) / segments.length;

        segments.forEach((segment, i) => {
            const startAngle = currentRotation + i * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            // Draw segment fill
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = PASTEL_COLORS[i % PASTEL_COLORS.length];
            ctx.fill();

            // Draw segment border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            drawLabel(segment.title, centerX, centerY, radius, startAngle, segmentAngle);
        });

        // Draw center circle (overlaid by spin button in DOM)
        drawCenter(centerX, centerY);

        // Draw outer ring
        drawOuterRing(centerX, centerY, radius);
    }

    function drawEmptyWheel(cx, cy, r) {
        // Soft grey wheel with dashed border
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 180, 220, 0.1)';
        ctx.fill();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(200, 180, 220, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);

        // Text
        ctx.font = '600 16px Nunito, sans-serif';
        ctx.fillStyle = '#7a6f8c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add segments to begin!', cx, cy);
    }

    function drawLabel(text, cx, cy, radius, startAngle, segmentAngle) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + segmentAngle / 2);

        // Position text in the middle of the segment, offset from center
        const textRadius = radius * 0.62;
        ctx.translate(textRadius, 0);
        ctx.rotate(Math.PI / 2);

        // Dynamic font size based on segment count (fewer = bigger, capped for aesthetics)
        const count = segments.length;
        let fontSize;
        if (count <= 2) fontSize = 18;
        else if (count <= 4) fontSize = 16;
        else if (count <= 6) fontSize = 14;
        else if (count <= 8) fontSize = 12;
        else if (count <= 12) fontSize = 11;
        else fontSize = 9;

        // Also adjust max text length based on available arc space
        const maxLen = count <= 4 ? 16 : count <= 8 ? 12 : 9;
        const displayText = text.length > maxLen ? text.substring(0, maxLen) + '…' : text;

        ctx.font = `700 ${fontSize}px Nunito, sans-serif`;
        ctx.fillStyle = '#4a3f5c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add subtle text shadow for readability
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(displayText, 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    function drawCenter(cx, cy) {
        // Small inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 180, 220, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawOuterRing(cx, cy, radius) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Decorative dots around the edge
        const dotCount = segments.length * 2;
        const dotRadius = 3;
        for (let i = 0; i < dotCount; i++) {
            const angle = (i / dotCount) * Math.PI * 2;
            const x = cx + Math.cos(angle) * (radius + 1);
            const y = cy + Math.sin(angle) * (radius + 1);
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }

    /**
     * Start the spin animation.
     * @param {number} winnerIndex - Predetermined winner segment index
     * @param {Function} callback - Called when spin completes with winner index
     */
    function spin(winnerIndex, callback) {
        if (isSpinning || segments.length === 0) return;

        isSpinning = true;
        onSpinComplete = callback;

        // Initialize audio on user interaction
        AudioEngine.init();

        const segmentAngle = (2 * Math.PI) / segments.length;

        // Calculate target angle so the winner is at the pointer (top, -PI/2)
        // The pointer is at the top. We need the middle of winnerIndex segment to align with top.
        const targetSegmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;
        // Add randomness within the segment
        const randomWithin = (Math.random() - 0.5) * segmentAngle * 0.6;
        // The wheel needs to stop so that when rotated, the segment center is at the top
        // Top is at angle -PI/2 (or 3PI/2), but since we subtract PI/2 in rendering,
        // we need the rotation to make segment center end up at the pointer
        // Final rotation = (2PI - targetSegmentCenter - randomWithin) mod 2PI
        let targetStop = (2 * Math.PI - targetSegmentCenter - randomWithin) % (2 * Math.PI);
        if (targetStop < 0) targetStop += 2 * Math.PI;

        // Add extra full rotations for drama (4-8 extra spins)
        const extraSpins = Math.floor(Math.random() * 5) + 4;
        const totalRotation = extraSpins * 2 * Math.PI + targetStop - (currentRotation % (2 * Math.PI));

        // Ensure we're always spinning forward
        const finalTotalRotation = totalRotation > 0 ? totalRotation : totalRotation + 2 * Math.PI;

        spinStartAngle = currentRotation;
        spinTotalAngle = finalTotalRotation;
        spinDuration = 4000 + Math.random() * 2000; // 4-6 seconds
        spinStartTime = performance.now();
        lastTickSegment = -1;

        animateFrame();
    }

    function animateFrame() {
        const now = performance.now();
        const elapsed = now - spinStartTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing: exponential decay with cubic out
        // Creates a fast start that slows down naturally
        const eased = 1 - Math.pow(1 - progress, 4);

        currentRotation = spinStartAngle + spinTotalAngle * eased;

        // Tick sound: detect when we cross a segment boundary
        const segmentAngle = (2 * Math.PI) / segments.length;
        const normalizedAngle = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const currentSegment = Math.floor(normalizedAngle / segmentAngle);

        if (currentSegment !== lastTickSegment && progress < 0.95) {
            AudioEngine.playTick();
            lastTickSegment = currentSegment;
        }

        render();

        if (progress < 1) {
            animationId = requestAnimationFrame(animateFrame);
        } else {
            // Spin complete
            isSpinning = false;
            animationId = null;

            if (onSpinComplete) {
                onSpinComplete();
            }
        }
    }

    /**
     * Check if wheel is currently spinning.
     */
    function getIsSpinning() {
        return isSpinning;
    }

    return { init, setSegments, getSegments, render, spin, getIsSpinning, handleResize };
})();
