/**
 * themes.js — Preset color theme registry and applier.
 *
 * Single source of truth for every color that changes per theme: the CSS
 * custom properties (driven onto :root via style.setProperty), the canvas
 * wheel segment palette, the editor color dots, the segment label color, and
 * the confetti palette. The canvas modules (wheel/editor/confetti) read from
 * Themes.getSegmentColors()/getConfettiColors()/getLabelColor() at draw time
 * so re-theming just needs a re-render.
 *
 * The 'pastel' preset reproduces the original app EXACTLY so the default is
 * visually unchanged.
 */
const Themes = (() => {
    const STORAGE_DEFAULT = 'pastel';

    // Original pastel wheel/preview palette (16 entries) — verbatim.
    const PASTEL_SEGMENTS = [
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

    // Original pastel confetti palette (10 entries) — verbatim.
    const PASTEL_CONFETTI = [
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

    // The CSS custom properties each theme can override. Only color-ish vars;
    // radii/font never change per theme so they stay in :root.
    const THEMES = {
        pastel: {
            id: 'pastel',
            label: 'Pastel Dream',
            label_color: '#4a3f5c', // segment label text color on the canvas
            vars: {
                '--bg-start': '#faf0f6',
                '--bg-end': '#f0f0ff',
                '--card-bg': '#ffffff',
                '--card-border': 'rgba(200, 180, 220, 0.3)',
                '--primary': '#f4a8c8',
                '--secondary': '#c8b8e8',
                '--success': '#a8e6cf',
                '--text': '#4a3f5c',
                '--text-light': '#7a6f8c',
                '--shadow': 'rgba(180, 160, 220, 0.15)',
                '--shadow-strong': 'rgba(180, 160, 220, 0.25)',
            },
            segments: PASTEL_SEGMENTS,
            confetti: PASTEL_CONFETTI,
        },

        midnight: {
            id: 'midnight',
            label: 'Midnight',
            label_color: '#f4f3fb',
            vars: {
                '--bg-start': '#1a1b2e',
                '--bg-end': '#0f1020',
                '--card-bg': '#242645',
                '--card-border': 'rgba(130, 140, 200, 0.3)',
                '--primary': '#7c6ff0',
                '--secondary': '#4ec5d6',
                '--success': '#5dd2a4',
                '--text': '#edecf7',
                '--text-light': '#a9a7c8',
                '--shadow': 'rgba(0, 0, 0, 0.4)',
                '--shadow-strong': 'rgba(0, 0, 0, 0.55)',
            },
            segments: [
                '#7c6ff0', '#4ec5d6', '#5dd2a4', '#f0a868',
                '#e86fa0', '#9a7af0', '#f0c850', '#5a9ff0',
                '#c86ff0', '#50c8b0', '#f08a6f', '#6fd0f0',
                '#a0e060', '#f06f9a', '#50d0d0', '#b08af0',
            ],
            confetti: [
                '#7c6ff0', '#4ec5d6', '#5dd2a4', '#f0a868',
                '#e86fa0', '#9a7af0', '#f0c850', '#5a9ff0',
                '#c86ff0', '#f08a6f',
            ],
        },

        neon: {
            id: 'neon',
            label: 'Neon',
            label_color: '#0a0a12',
            vars: {
                '--bg-start': '#13111c',
                '--bg-end': '#07060d',
                '--card-bg': '#1c1930',
                '--card-border': 'rgba(255, 70, 200, 0.35)',
                '--primary': '#ff2e97',
                '--secondary': '#00e5ff',
                '--success': '#39ff14',
                '--text': '#f5f0ff',
                '--text-light': '#b8a8d8',
                '--shadow': 'rgba(255, 46, 151, 0.2)',
                '--shadow-strong': 'rgba(0, 229, 255, 0.3)',
            },
            segments: [
                '#ff2e97', '#00e5ff', '#39ff14', '#ffe600',
                '#ff6b00', '#b026ff', '#00ffc8', '#ff0059',
                '#2bd9ff', '#aaff00', '#ff00e5', '#00ff8c',
                '#ffd000', '#ff4d4d', '#7cff00', '#4d7bff',
            ],
            confetti: [
                '#ff2e97', '#00e5ff', '#39ff14', '#ffe600',
                '#ff6b00', '#b026ff', '#00ffc8', '#ff0059',
                '#2bd9ff', '#aaff00',
            ],
        },

        ocean: {
            id: 'ocean',
            label: 'Ocean',
            label_color: '#07354a',
            vars: {
                '--bg-start': '#e3f6fb',
                '--bg-end': '#d0ecf5',
                '--card-bg': '#ffffff',
                '--card-border': 'rgba(70, 150, 180, 0.3)',
                '--primary': '#2b9cc4',
                '--secondary': '#4fc3d8',
                '--success': '#5fd0b0',
                '--text': '#0c3a4e',
                '--text-light': '#3f7488',
                '--shadow': 'rgba(40, 120, 160, 0.18)',
                '--shadow-strong': 'rgba(40, 120, 160, 0.3)',
            },
            segments: [
                '#7fd4e8', '#55bcd6', '#8fe0d0', '#3fa8c8',
                '#a0e8e0', '#6fcad8', '#4fb8c0', '#9ad8e8',
                '#5fc8b8', '#80d8e0', '#3f98c0', '#aee4ec',
                '#6fd0c0', '#50b4d0', '#90e0d8', '#60c0d8',
            ],
            confetti: [
                '#7fd4e8', '#55bcd6', '#8fe0d0', '#3fa8c8',
                '#a0e8e0', '#6fcad8', '#4fb8c0', '#9ad8e8',
                '#5fc8b8', '#80d8e0',
            ],
        },

        sunset: {
            id: 'sunset',
            label: 'Sunset',
            label_color: '#5a2714',
            vars: {
                '--bg-start': '#fff0e6',
                '--bg-end': '#ffe4ec',
                '--card-bg': '#fffaf6',
                '--card-border': 'rgba(220, 140, 110, 0.3)',
                '--primary': '#f47a5a',
                '--secondary': '#f4a85a',
                '--success': '#f0c05a',
                '--text': '#6b2f1a',
                '--text-light': '#a65f44',
                '--shadow': 'rgba(220, 120, 90, 0.18)',
                '--shadow-strong': 'rgba(220, 120, 90, 0.3)',
            },
            segments: [
                '#ffb38a', '#ff9472', '#ffc98a', '#ff7f8a',
                '#ffd59e', '#f98f6f', '#ffb0a0', '#ffcf7a',
                '#ff9b6f', '#ffbe8f', '#ff8f9f', '#ffd8a0',
                '#f9a07a', '#ffc0b0', '#ffca8a', '#ff8f7a',
            ],
            confetti: [
                '#ffb38a', '#ff9472', '#ffc98a', '#ff7f8a',
                '#ffd59e', '#f98f6f', '#ffb0a0', '#ffcf7a',
                '#ff9b6f', '#ffbe8f',
            ],
        },

        forest: {
            id: 'forest',
            label: 'Forest',
            label_color: '#1e3519',
            vars: {
                '--bg-start': '#eef4e5',
                '--bg-end': '#e2eed6',
                '--card-bg': '#fbfdf7',
                '--card-border': 'rgba(110, 150, 90, 0.3)',
                '--primary': '#5a9c54',
                '--secondary': '#8bb86a',
                '--success': '#a7c97a',
                '--text': '#28431f',
                '--text-light': '#55724a',
                '--shadow': 'rgba(90, 130, 70, 0.18)',
                '--shadow-strong': 'rgba(90, 130, 70, 0.3)',
            },
            segments: [
                '#8fbf6a', '#6ba85a', '#a7c97a', '#5a9c54',
                '#bcd48a', '#7cb064', '#9ac070', '#689a52',
                '#aecd82', '#78b060', '#5f9450', '#c0d890',
                '#84b868', '#6ca858', '#a0c878', '#90c070',
            ],
            confetti: [
                '#8fbf6a', '#6ba85a', '#a7c97a', '#5a9c54',
                '#bcd48a', '#7cb064', '#9ac070', '#689a52',
                '#aecd82', '#78b060',
            ],
        },
    };

    // Order presented in the picker (pastel first so default sits on top).
    const ORDER = ['pastel', 'midnight', 'neon', 'ocean', 'sunset', 'forest'];

    let currentId = STORAGE_DEFAULT;

    function get(id) {
        return THEMES[id] || THEMES[STORAGE_DEFAULT];
    }

    function getAll() {
        return ORDER.filter(id => THEMES[id]).map(id => ({
            id: THEMES[id].id,
            label: THEMES[id].label,
        }));
    }

    function getCurrentId() {
        return currentId;
    }

    function getSegmentColors() {
        return get(currentId).segments;
    }

    function getConfettiColors() {
        return get(currentId).confetti;
    }

    function getLabelColor() {
        return get(currentId).label_color;
    }

    /**
     * Apply a theme: set data-theme, write CSS vars onto :root, and trigger a
     * re-render of the canvas modules so their palettes update immediately.
     * @param {string} id
     */
    function apply(id) {
        const theme = get(id);
        currentId = theme.id;

        const root = document.documentElement;
        root.setAttribute('data-theme', theme.id);

        Object.keys(theme.vars).forEach(key => {
            root.style.setProperty(key, theme.vars[key]);
        });

        // Re-render wheel with new palette if it's ready.
        if (typeof Wheel !== 'undefined' && Wheel.render) {
            Wheel.render();
        }

        // Refresh editor color dots if the editor exposes a hook and modal open.
        if (typeof App !== 'undefined' && App.refreshThemePreview) {
            App.refreshThemePreview();
        }
    }

    return {
        getAll,
        get,
        getCurrentId,
        apply,
        getSegmentColors,
        getConfettiColors,
        getLabelColor,
    };
})();
