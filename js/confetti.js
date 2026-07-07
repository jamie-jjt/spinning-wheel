/**
 * confetti.js — Canvas-based confetti celebration effect
 * Pastel-colored particles with gravity, rotation, and spread physics.
 */
const Confetti = (() => {
    let canvas, ctx;
    let particles = [];
    let animationId = null;
    let isRunning = false;

    // Pastel confetti colors matching the theme
    const COLORS = [
        '#f4a8c8', // soft pink
        '#c8b8e8', // lavender
        '#a8e6cf', // mint
        '#f8d0e0', // blush
        '#d0e8f8', // baby blue
        '#e8d0f8', // lilac
        '#f8e8a0', // soft yellow
        '#a8d8e8', // sky
        '#e8a8c8', // rose
        '#b8e8b8', // sage
    ];

    const SHAPES = ['rect', 'circle', 'strip'];

    function init() {
        canvas = document.getElementById('confettiCanvas');
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /**
     * Create a single confetti particle with randomized properties.
     */
    function createParticle() {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

        return {
            x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5,
            y: canvas.height * 0.3 + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 12,
            vy: -(Math.random() * 8 + 4),
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            size: Math.random() * 8 + 4,
            color: color,
            shape: shape,
            gravity: 0.15 + Math.random() * 0.1,
            drag: 0.98 + Math.random() * 0.015,
            opacity: 1,
            fadeSpeed: 0.003 + Math.random() * 0.005,
            wobble: Math.random() * 10,
            wobbleSpeed: 0.05 + Math.random() * 0.05,
        };
    }

    /**
     * Launch confetti celebration!
     * @param {number} count - Number of particles (default 120)
     */
    function launch(count = 120) {
        // Check prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        init();
        particles = [];

        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }

        if (!isRunning) {
            isRunning = true;
            animate();
        }

        // Auto-clear after 4 seconds
        setTimeout(() => {
            stop();
        }, 4000);
    }

    function animate() {
        if (!isRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles = particles.filter(p => p.opacity > 0.01);

        if (particles.length === 0) {
            isRunning = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        particles.forEach(p => {
            // Physics update
            p.vy += p.gravity;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.x += p.vx + Math.sin(p.wobble) * 0.5;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;

            // Fade out when below viewport or after time
            if (p.y > canvas.height * 0.8) {
                p.opacity -= p.fadeSpeed * 3;
            } else {
                p.opacity -= p.fadeSpeed;
            }

            // Draw
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;

            switch (p.shape) {
                case 'rect':
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'strip':
                    ctx.fillRect(-p.size / 6, -p.size, p.size / 3, p.size * 2);
                    break;
            }

            ctx.restore();
        });

        animationId = requestAnimationFrame(animate);
    }

    function stop() {
        // Let particles finish naturally by just marking as stopping
        // They'll fade out and the animation loop will clean up
        if (particles.length === 0) {
            isRunning = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    return { launch };
})();
