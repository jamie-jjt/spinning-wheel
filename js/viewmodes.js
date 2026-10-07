/**
 * viewmodes.js — Fullscreen / focused wheel view
 * Toggles a focused view that enlarges the wheel and hides the lower-right
 * settings FAB. Uses the native Fullscreen API when available, with a
 * class-based fallback so it still works from file:// where the API is
 * commonly unavailable or rejected.
 */
const ViewModes = (() => {
    const FOCUS_CLASS = 'wheel-focus';
    const NORMAL_MAX = 680;
    const FOCUS_MAX = 900;

    let fullscreenBtn;
    let modalOverlay;
    let winnerOverlay;
    let isFocused = false;

    function init() {
        fullscreenBtn = document.getElementById('fullscreenBtn');
        modalOverlay = document.getElementById('modalOverlay');
        winnerOverlay = document.getElementById('winnerOverlay');
        if (!fullscreenBtn) return;

        fullscreenBtn.addEventListener('click', toggle);
        document.addEventListener('fullscreenchange', syncWithNative);

        // Escape exits focus view only when nothing else owns Escape.
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || !isFocused) return;
            if (isModalOpen() || isWinnerOpen()) return; // editor.js handles those
            // When in true native fullscreen, the browser handles Esc and fires
            // fullscreenchange, which resets state. Only act on the fallback case.
            if (document.fullscreenElement) return;
            exitFocus();
        });
    }

    function isModalOpen() {
        return modalOverlay && modalOverlay.style.display !== 'none';
    }

    function isWinnerOpen() {
        return winnerOverlay && winnerOverlay.style.display !== 'none';
    }

    function toggle() {
        if (isFocused) {
            exitFocus();
        } else {
            enterFocus();
        }
    }

    function enterFocus() {
        isFocused = true;
        document.body.classList.add(FOCUS_CLASS);
        fullscreenBtn.setAttribute('aria-pressed', 'true');

        if (typeof Wheel !== 'undefined' && Wheel.setMaxSize) {
            Wheel.setMaxSize(FOCUS_MAX);
        }

        // Attempt real fullscreen; swallow failures (e.g. on file://).
        const el = document.documentElement;
        if (el.requestFullscreen && !document.fullscreenElement) {
            try {
                const result = el.requestFullscreen();
                if (result && typeof result.catch === 'function') {
                    result.catch(() => { /* fallback class view is already active */ });
                }
            } catch (e) {
                /* fallback class view is already active */
            }
        }
    }

    function exitFocus() {
        isFocused = false;
        document.body.classList.remove(FOCUS_CLASS);
        fullscreenBtn.setAttribute('aria-pressed', 'false');

        if (typeof Wheel !== 'undefined' && Wheel.setMaxSize) {
            Wheel.setMaxSize(NORMAL_MAX);
        }

        if (document.fullscreenElement && document.exitFullscreen) {
            try {
                const result = document.exitFullscreen();
                if (result && typeof result.catch === 'function') {
                    result.catch(() => { /* ignore */ });
                }
            } catch (e) {
                /* ignore */
            }
        }
    }

    // Keep state in sync when the user exits native fullscreen via F11/Esc.
    function syncWithNative() {
        if (!document.fullscreenElement && isFocused) {
            exitFocus();
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
