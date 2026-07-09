/**
 * audio.js — Web Audio API sound effects
 * Generates tick sounds and winner fanfare entirely with synthesis.
 */
const AudioEngine = (() => {
    let ctx = null;

    function getContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    /**
     * Play a short tick sound as the wheel passes a segment boundary.
     * Uses a short sine blip for a soft, pastel-friendly click.
     */
    function playTick() {
        try {
            const ac = getContext();
            const osc = ac.createOscillator();
            const gain = ac.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1800, ac.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.03);

            gain.gain.setValueAtTime(0.15, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ac.destination);

            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.05);
        } catch (e) {
            // Silently fail if audio isn't available
        }
    }

    /**
     * Play a cheerful fanfare chord when the winner is determined.
     * Stacks multiple oscillators for a bright, happy sound.
     */
    function playFanfare() {
        try {
            const ac = getContext();
            const now = ac.currentTime;

            // Cheerful major chord: C5, E5, G5, C6
            const frequencies = [523.25, 659.25, 783.99, 1046.5];
            const duration = 0.8;

            frequencies.forEach((freq, i) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();

                osc.type = i < 2 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                // Stagger the entry slightly for an arpeggio feel
                const startTime = now + i * 0.05;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
                gain.gain.setValueAtTime(0.12, startTime + duration * 0.6);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                osc.connect(gain);
                gain.connect(ac.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            });

            // Add a sparkle on top
            setTimeout(() => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2093, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1568, ac.currentTime + 0.3);
                gain.gain.setValueAtTime(0.08, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(ac.currentTime);
                osc.stop(ac.currentTime + 0.3);
            }, 200);
        } catch (e) {
            // Silently fail
        }
    }

    /**
     * Play a gentle chime for a "lose" outcome.
     * Soft triangle wave with a descending minor third (E5 → C5).
     * Warm and acknowledging — not sad or harsh.
     */
    function playGentleChime() {
        try {
            const ac = getContext();
            const now = ac.currentTime;

            // Descending minor third: E5 → C5
            const notes = [659.25, 523.25];
            const duration = 0.6;

            notes.forEach((freq, i) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.25);

                const startTime = now + i * 0.25;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.08, startTime + 0.04);
                gain.gain.setValueAtTime(0.08, startTime + duration * 0.4);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                osc.connect(gain);
                gain.connect(ac.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            });
        } catch (e) {
            // Silently fail
        }
    }

    /**
     * Ensure audio context is ready (call on first user interaction).
     */
    function init() {
        getContext();
    }

    return { playTick, playFanfare, playGentleChime, init };
})();
