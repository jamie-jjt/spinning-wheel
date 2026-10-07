/**
 * editor.js — Modal editor logic, settings, and main app controller
 * Handles add/remove segments, persistence, settings toggles, and spin flow.
 */
const App = (() => {
    // DOM elements
    const spinBtn = document.getElementById('spinBtn');
    const editBtn = document.getElementById('editBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    const segmentsList = document.getElementById('segmentsList');
    const addSegmentBtn = document.getElementById('addSegmentBtn');
    const saveBtn = document.getElementById('saveBtn');
    const validationMsg = document.getElementById('validationMsg');
    const totalWeightEl = document.getElementById('totalWeight');
    const weightedToggle = document.getElementById('weightedToggle');
    const removeToggle = document.getElementById('removeToggle');
    const winLoseToggle = document.getElementById('winLoseToggle');
    const themeSelect = document.getElementById('themeSelect');
    const emptyState = document.getElementById('emptyState');
    const resetState = document.getElementById('resetState');
    const resetBtn = document.getElementById('resetBtn');
    const winnerOverlay = document.getElementById('winnerOverlay');
    const winnerEmoji = document.getElementById('winnerEmoji');
    const winnerQubyGif = document.getElementById('winnerQubyGif');
    const winnerTitle = document.getElementById('winnerTitle');
    const winnerName = document.getElementById('winnerName');
    const winnerMessage = document.getElementById('winnerMessage');
    const winnerDismiss = document.getElementById('winnerDismiss');

    // App state
    let segments = []; // Current active segments { title, weight, outcome? }
    let originalSegments = []; // Original saved segments (for reset)
    let settings = {
        weighted: true,
        removeWinner: false,
        winLoseMode: false,
        theme: 'pastel',
    };

    // Editor temp state
    let editorSegments = [];

    const STORAGE_KEY = 'spinning-wheel-data';

    // Pastel colors for segment preview dots — fallback used when the Themes
    // module isn't loaded; otherwise the active theme's palette is read.
    const PREVIEW_COLORS = [
        '#FFB3C6', '#C8B8E8', '#A8E6CF', '#FFD6A5', '#B5EAD7',
        '#E2B4F0', '#FFDAC1', '#98D8E8', '#F4C2C2', '#C1E1C1',
        '#D4A5E5', '#FFF3B0', '#B4D7E8', '#F0B8D0', '#C8E8B0', '#E8C8D8',
    ];

    // Read the active theme's palette for the editor color dots, falling back
    // to the pastel preview colors if Themes isn't available.
    function getPreviewColors() {
        if (typeof Themes !== 'undefined' && Themes.getSegmentColors) {
            const colors = Themes.getSegmentColors();
            if (colors && colors.length) return colors;
        }
        return PREVIEW_COLORS;
    }

    // Win/Lose display config
    const WIN_CONFIG = {
        emoji: '🎊',
        title: 'Congratulations!',
        gif: 'https://media.tenor.com/oQ_6wxtMrx0AAAAj/pentol-quby.gif',
        messages: ["You're amazing!", "What a lucky spin!", "You did it!", "Winner winner!"],
        dismissText: 'Awesome! 🎉',
    };

    const LOSE_CONFIG = {
        emoji: '💫',
        title: 'Better luck next time!',
        gif: 'https://media.tenor.com/hqXIMauJdRMAAAAj/quby-pentol.gif',
        messages: ["Thanks for playing!", "Don't give up!", "Almost had it!", "Next time for sure!"],
        dismissText: 'Try again! 💪',
    };

    /**
     * Initialize the application.
     */
    function init() {
        loadFromStorage();
        populateThemeSelect();
        // Apply the saved theme before the first render so there is no flash
        // of the wrong theme on reload for non-pastel saved themes.
        if (typeof Themes !== 'undefined' && Themes.apply) {
            Themes.apply(settings.theme);
        }
        Wheel.init();
        updateWheelDisplay();
        bindEvents();
    }

    function populateThemeSelect() {
        if (!themeSelect || typeof Themes === 'undefined' || !Themes.getAll) return;
        themeSelect.innerHTML = '';
        Themes.getAll().forEach(({ id, label }) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = label;
            themeSelect.appendChild(opt);
        });
        themeSelect.value = settings.theme;
    }

    // Called by Themes.apply() so the editor color dots refresh live when the
    // modal is open and the theme changes.
    function refreshThemePreview() {
        if (modalOverlay && modalOverlay.style.display !== 'none') {
            renderEditorSegments();
        }
    }

    function bindEvents() {
        spinBtn.addEventListener('click', handleSpin);
        editBtn.addEventListener('click', openModal);
        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        addSegmentBtn.addEventListener('click', addEditorSegment);
        saveBtn.addEventListener('click', handleSave);
        weightedToggle.addEventListener('change', updateEditorUI);
        winLoseToggle.addEventListener('change', updateEditorUI);
        if (themeSelect) {
            // Live preview while the modal is open; reverted on cancel/close.
            themeSelect.addEventListener('change', () => {
                if (typeof Themes !== 'undefined' && Themes.apply) {
                    Themes.apply(themeSelect.value);
                }
            });
        }
        resetBtn.addEventListener('click', handleReset);
        winnerDismiss.addEventListener('click', dismissWinner);
        winnerOverlay.addEventListener('click', (e) => {
            if (e.target === winnerOverlay) dismissWinner();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (winnerOverlay.style.display !== 'none') {
                    dismissWinner();
                } else if (modalOverlay.style.display !== 'none') {
                    closeModal();
                }
            }
        });
    }

    // ===== STORAGE =====

    function saveToStorage() {
        const data = {
            segments: segments,
            originalSegments: originalSegments,
            settings: settings,
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // Storage unavailable
        }
    }

    function loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                // Backward compatible: ensure outcome field defaults to 'win'
                segments = (data.segments || []).map(s => ({
                    title: s.title,
                    weight: s.weight,
                    outcome: s.outcome || 'win',
                }));
                originalSegments = (data.originalSegments || []).map(s => ({
                    title: s.title,
                    weight: s.weight,
                    outcome: s.outcome || 'win',
                }));
                settings = { weighted: true, removeWinner: false, winLoseMode: false, theme: 'pastel', ...data.settings };
            }
        } catch (e) {
            // Storage unavailable or corrupted
        }
    }

    // ===== WHEEL DISPLAY =====

    function updateWheelDisplay() {
        Wheel.setSegments(segments);

        if (segments.length === 0 && originalSegments.length > 0) {
            // All eliminated
            emptyState.style.display = 'none';
            resetState.style.display = 'block';
            spinBtn.disabled = true;
        } else if (segments.length === 0) {
            emptyState.style.display = 'block';
            resetState.style.display = 'none';
            spinBtn.disabled = true;
        } else {
            emptyState.style.display = 'none';
            resetState.style.display = 'none';
            spinBtn.disabled = false;
        }
    }

    // ===== SPIN =====

    function handleSpin() {
        if (Wheel.getIsSpinning() || segments.length === 0) return;

        AudioEngine.init();
        spinBtn.disabled = true;

        // Select winner before spin
        const winnerIndex = WeightedEngine.selectWinner(segments, settings.weighted);

        Wheel.spin(winnerIndex, () => {
            // Spin complete
            const winner = segments[winnerIndex];
            const outcome = settings.winLoseMode ? (winner.outcome || 'win') : 'win';

            showWinner(winner.title, outcome);

            if (outcome === 'win') {
                AudioEngine.playFanfare();
                Confetti.launch(150);
            } else {
                AudioEngine.playGentleChime();
                // No confetti for lose
            }

            // Remove winner if setting is on
            if (settings.removeWinner) {
                segments.splice(winnerIndex, 1);
                if (segments.length > 0 && settings.weighted) {
                    segments = WeightedEngine.redistributeWeights(segments);
                }
                saveToStorage();
                // Wheel will re-render after winner dismissed
            }

            spinBtn.disabled = segments.length === 0;
        });
    }

    // ===== WINNER DISPLAY =====

    function showWinner(name, outcome) {
        const config = outcome === 'lose' ? LOSE_CONFIG : WIN_CONFIG;
        const randomMsg = config.messages[Math.floor(Math.random() * config.messages.length)];

        // Update overlay content
        winnerEmoji.textContent = config.emoji;
        winnerTitle.textContent = config.title;
        winnerName.textContent = name;
        winnerMessage.textContent = randomMsg;
        winnerMessage.style.display = 'block';
        winnerDismiss.textContent = config.dismissText;

        // Quby GIF
        winnerQubyGif.src = config.gif;
        winnerQubyGif.style.display = 'block';

        // Apply lose class modifier for different background tint
        if (outcome === 'lose') {
            winnerOverlay.classList.add('lose');
        } else {
            winnerOverlay.classList.remove('lose');
        }

        winnerOverlay.style.display = 'flex';
        // Trigger reflow for animation
        void winnerOverlay.offsetWidth;
        winnerOverlay.classList.add('active');
    }

    function dismissWinner() {
        winnerOverlay.classList.remove('active');
        setTimeout(() => {
            winnerOverlay.style.display = 'none';
            winnerOverlay.classList.remove('lose');
            winnerQubyGif.style.display = 'none';
            winnerQubyGif.src = '';
            winnerMessage.style.display = 'none';
            // Update display after removing winner
            updateWheelDisplay();
        }, 300);
    }

    // ===== RESET =====

    function handleReset() {
        segments = JSON.parse(JSON.stringify(originalSegments));
        saveToStorage();
        updateWheelDisplay();
    }

    // ===== MODAL =====

    function openModal() {
        // Load current state into editor
        editorSegments = segments.map(s => ({ ...s }));
        weightedToggle.checked = settings.weighted;
        removeToggle.checked = settings.removeWinner;
        winLoseToggle.checked = settings.winLoseMode;
        if (themeSelect) themeSelect.value = settings.theme;

        renderEditorSegments();
        updateTotalWeight();
        validationMsg.textContent = '';

        modalOverlay.style.display = 'flex';
        void modalOverlay.offsetWidth;
        modalOverlay.classList.add('active');

        // Trap focus
        modal.querySelector('.modal-close').focus();
    }

    function closeModal() {
        // Revert any live theme preview back to the saved theme (cancel path).
        if (themeSelect && themeSelect.value !== settings.theme &&
            typeof Themes !== 'undefined' && Themes.apply) {
            Themes.apply(settings.theme);
            themeSelect.value = settings.theme;
        }
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);
    }

    function addEditorSegment() {
        editorSegments.push({ title: '', weight: 0, outcome: 'win' });
        renderEditorSegments();
        updateTotalWeight();

        // Focus the new title input
        const items = segmentsList.querySelectorAll('.segment-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
            lastItem.querySelector('input[type="text"]').focus();
        }
    }

    function removeEditorSegment(index) {
        editorSegments.splice(index, 1);
        renderEditorSegments();
        updateTotalWeight();
    }

    function renderEditorSegments() {
        segmentsList.innerHTML = '';

        const previewColors = getPreviewColors();

        editorSegments.forEach((seg, i) => {
            const item = document.createElement('div');
            item.className = 'segment-item';

            const colorDot = document.createElement('div');
            colorDot.className = 'segment-color';
            colorDot.style.backgroundColor = previewColors[i % previewColors.length];

            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.placeholder = 'Segment name';
            titleInput.value = seg.title;
            titleInput.setAttribute('aria-label', `Segment ${i + 1} name`);
            titleInput.addEventListener('input', (e) => {
                editorSegments[i].title = e.target.value;
            });

            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.min = '0';
            weightInput.max = '100';
            weightInput.step = '0.1';
            weightInput.placeholder = '%';
            weightInput.value = seg.weight || '';
            weightInput.setAttribute('aria-label', `Segment ${i + 1} weight percentage`);
            weightInput.disabled = !weightedToggle.checked;
            weightInput.addEventListener('input', (e) => {
                editorSegments[i].weight = parseFloat(e.target.value) || 0;
                updateTotalWeight();
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'segment-remove';
            removeBtn.innerHTML = '×';
            removeBtn.setAttribute('aria-label', `Remove segment ${i + 1}`);
            removeBtn.addEventListener('click', () => removeEditorSegment(i));

            item.appendChild(colorDot);
            item.appendChild(titleInput);

            // Outcome dropdown (win/lose mode)
            if (winLoseToggle.checked) {
                const outcomeSelect = document.createElement('select');
                outcomeSelect.className = 'outcome-select';
                outcomeSelect.setAttribute('aria-label', `Segment ${i + 1} outcome`);

                const winOption = document.createElement('option');
                winOption.value = 'win';
                winOption.textContent = 'Win 🏆';

                const loseOption = document.createElement('option');
                loseOption.value = 'lose';
                loseOption.textContent = 'Lose 💫';

                outcomeSelect.appendChild(winOption);
                outcomeSelect.appendChild(loseOption);
                outcomeSelect.value = seg.outcome || 'win';

                outcomeSelect.addEventListener('change', (e) => {
                    editorSegments[i].outcome = e.target.value;
                });

                item.appendChild(outcomeSelect);
            }

            if (weightedToggle.checked) {
                item.appendChild(weightInput);
            }
            item.appendChild(removeBtn);
            segmentsList.appendChild(item);
        });
    }

    function updateEditorUI() {
        renderEditorSegments();
        updateTotalWeight();
    }

    function updateTotalWeight() {
        if (!weightedToggle.checked) {
            totalWeightEl.textContent = 'Equal (auto)';
            totalWeightEl.className = 'total-value valid';
            return;
        }

        const total = editorSegments.reduce((sum, s) => sum + (s.weight || 0), 0);
        const rounded = Math.round(total * 100) / 100;
        totalWeightEl.textContent = `${rounded}%`;

        if (Math.abs(rounded - 100) < 0.01) {
            totalWeightEl.className = 'total-value valid';
        } else {
            totalWeightEl.className = 'total-value invalid';
        }
    }

    function handleSave() {
        // Validation
        const hasEmptyTitles = editorSegments.some(s => !s.title.trim());
        if (hasEmptyTitles) {
            validationMsg.textContent = 'All segments need a name!';
            return;
        }

        if (editorSegments.length === 0) {
            validationMsg.textContent = 'Add at least one segment!';
            return;
        }

        if (weightedToggle.checked) {
            const total = editorSegments.reduce((sum, s) => sum + (s.weight || 0), 0);
            if (Math.abs(total - 100) > 0.1) {
                validationMsg.textContent = `Weights must total 100% (currently ${Math.round(total * 100) / 100}%)`;
                return;
            }
        } else {
            // Equal mode: assign equal weights internally
            const equalWeight = 100 / editorSegments.length;
            editorSegments = editorSegments.map(s => ({ ...s, weight: Math.round(equalWeight * 100) / 100 }));
        }

        // Save
        const isWinLose = winLoseToggle.checked;
        segments = editorSegments.map(s => {
            const seg = {
                title: s.title.trim(),
                weight: s.weight,
            };
            if (isWinLose) {
                seg.outcome = s.outcome || 'win';
            }
            return seg;
        });
        originalSegments = JSON.parse(JSON.stringify(segments));
        settings.weighted = weightedToggle.checked;
        settings.removeWinner = removeToggle.checked;
        settings.winLoseMode = winLoseToggle.checked;
        if (themeSelect) settings.theme = themeSelect.value;

        // Apply the chosen theme (updates CSS vars + canvas palette).
        if (typeof Themes !== 'undefined' && Themes.apply) {
            Themes.apply(settings.theme);
        }

        saveToStorage();
        updateWheelDisplay();
        closeModal();
        validationMsg.textContent = '';
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, refreshThemePreview };
})();
