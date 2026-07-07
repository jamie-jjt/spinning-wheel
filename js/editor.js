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
    const emptyState = document.getElementById('emptyState');
    const resetState = document.getElementById('resetState');
    const resetBtn = document.getElementById('resetBtn');
    const winnerOverlay = document.getElementById('winnerOverlay');
    const winnerName = document.getElementById('winnerName');
    const winnerDismiss = document.getElementById('winnerDismiss');

    // App state
    let segments = []; // Current active segments { title, weight }
    let originalSegments = []; // Original saved segments (for reset)
    let settings = {
        weighted: true,
        removeWinner: false,
    };

    // Editor temp state
    let editorSegments = [];

    const STORAGE_KEY = 'spinning-wheel-data';

    // Pastel colors for segment preview dots
    const PREVIEW_COLORS = [
        '#FFB3C6', '#C8B8E8', '#A8E6CF', '#FFD6A5', '#B5EAD7',
        '#E2B4F0', '#FFDAC1', '#98D8E8', '#F4C2C2', '#C1E1C1',
        '#D4A5E5', '#FFF3B0', '#B4D7E8', '#F0B8D0', '#C8E8B0', '#E8C8D8',
    ];

    /**
     * Initialize the application.
     */
    function init() {
        loadFromStorage();
        Wheel.init();
        updateWheelDisplay();
        bindEvents();
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
                segments = data.segments || [];
                originalSegments = data.originalSegments || [];
                settings = { ...settings, ...data.settings };
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
            showWinner(winner.title);
            AudioEngine.playFanfare();
            Confetti.launch(150);

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

    function showWinner(name) {
        winnerName.textContent = name;
        winnerOverlay.style.display = 'flex';
        // Trigger reflow for animation
        void winnerOverlay.offsetWidth;
        winnerOverlay.classList.add('active');

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (winnerOverlay.classList.contains('active')) {
                dismissWinner();
            }
        }, 5000);
    }

    function dismissWinner() {
        winnerOverlay.classList.remove('active');
        setTimeout(() => {
            winnerOverlay.style.display = 'none';
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
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);
    }

    function addEditorSegment() {
        editorSegments.push({ title: '', weight: 0 });
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

        editorSegments.forEach((seg, i) => {
            const item = document.createElement('div');
            item.className = 'segment-item';

            const colorDot = document.createElement('div');
            colorDot.className = 'segment-color';
            colorDot.style.backgroundColor = PREVIEW_COLORS[i % PREVIEW_COLORS.length];

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
        segments = editorSegments.map(s => ({
            title: s.title.trim(),
            weight: s.weight,
        }));
        originalSegments = JSON.parse(JSON.stringify(segments));
        settings.weighted = weightedToggle.checked;
        settings.removeWinner = removeToggle.checked;

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

    return { init };
})();
