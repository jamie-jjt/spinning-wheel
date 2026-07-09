/**
 * chibi.js — Animated GIF-based chibi companion
 * Uses real animated GIFs for idle and cheering states.
 * Idle: cute anime chibi girl standing/smiling
 * Cheer: anime girl raising arms and cheering
 */
const Chibi = (() => {
    let container;
    let character;
    let idleImg;
    let cheerImg;
    let sparkles;
    let bubble;
    let cheerTimeout = null;
    let bubbleTimeout = null;
    let isHidden = false;
    let isCheering = false;

    // GIF sources (Tenor - Quby character)
    // Idle: leaning Quby (sticker format, transparent)
    const IDLE_GIF = 'https://media.tenor.com/1Si3A6alsiEAAAAj/pentol-quby.gif';
    // Cheer: Quby with pom poms (sticker format, transparent)
    const CHEER_GIF = 'https://media.tenor.com/AlUwZp0ih_wAAAAj/pentol-quby.gif';

    const CHEER_PHRASES = [
        '✨ Go go go!',
        '🎉 Yaaay!',
        '💫 Spin it!',
        '🌟 So lucky!',
        '💖 Woohoo!',
        '🎊 Wheee!',
        '⭐ You got this!',
        '🎶 Let\'s go!',
        '💝 Exciting!',
        '🌈 Good luck!',
    ];

    function init() {
        createChibiDOM();
        bindEvents();
        observeModal();

        requestAnimationFrame(() => {
            document.body.classList.add('chibi-active');
            container.classList.add('chibi-visible');
        });
    }

    function createChibiDOM() {
        container = document.createElement('div');
        container.className = 'chibi-container';
        container.setAttribute('aria-hidden', 'true');

        container.innerHTML = `
            <div class="chibi-bubble"></div>
            <div class="chibi-character">
                <!-- Sparkle effects -->
                <div class="chibi-sparkles">
                    <div class="sparkle s1">✦</div>
                    <div class="sparkle s2">✧</div>
                    <div class="sparkle s3">⋆</div>
                    <div class="sparkle s4">✦</div>
                    <div class="sparkle s5">✧</div>
                    <div class="sparkle s6">⋆</div>
                </div>
                <!-- Heart effects -->
                <div class="chibi-hearts">
                    <div class="heart h1">💕</div>
                    <div class="heart h2">💖</div>
                    <div class="heart h3">💗</div>
                </div>
                <!-- GIF images -->
                <div class="chibi-gif-wrapper">
                    <img src="${IDLE_GIF}" alt="" class="chibi-gif chibi-gif-idle" />
                    <img src="${CHEER_GIF}" alt="" class="chibi-gif chibi-gif-cheer" />
                </div>
                <!-- Ground shadow -->
                <div class="chibi-shadow"></div>
            </div>
        `;

        document.body.appendChild(container);

        // Cache references
        character = container.querySelector('.chibi-character');
        idleImg = container.querySelector('.chibi-gif-idle');
        cheerImg = container.querySelector('.chibi-gif-cheer');
        sparkles = container.querySelector('.chibi-sparkles');
        bubble = container.querySelector('.chibi-bubble');

        // Preload cheer GIF so it's ready instantly
        const preload = new Image();
        preload.src = CHEER_GIF;
    }

    function bindEvents() {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (Wheel.getIsSpinning()) {
                        startCheer();
                    }
                }, 150);
            });
        }
    }

    function observeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (!modalOverlay) return;

        const observer = new MutationObserver(() => {
            const isModalOpen = modalOverlay.classList.contains('active') ||
                                modalOverlay.style.display === 'flex';
            if (isModalOpen && !isHidden) {
                hide();
            } else if (!isModalOpen && isHidden) {
                show();
            }
        });

        observer.observe(modalOverlay, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    }

    function startCheer() {
        if (cheerTimeout) clearTimeout(cheerTimeout);
        isCheering = true;

        // Swap to cheer GIF
        character.classList.add('cheering');

        // Force GIF to restart by resetting src
        cheerImg.src = '';
        cheerImg.src = CHEER_GIF;

        // Show effects
        sparkles.classList.add('active');
        container.querySelector('.chibi-hearts').classList.add('active');

        // Speech bubble
        showBubble(CHEER_PHRASES[Math.floor(Math.random() * CHEER_PHRASES.length)]);

        // Stop after spin duration
        cheerTimeout = setTimeout(() => {
            stopCheer();
        }, 5500);
    }

    function stopCheer() {
        isCheering = false;
        character.classList.remove('cheering');
        sparkles.classList.remove('active');
        container.querySelector('.chibi-hearts').classList.remove('active');
        hideBubble();
        cheerTimeout = null;
    }

    function showBubble(text) {
        if (bubbleTimeout) clearTimeout(bubbleTimeout);
        bubble.textContent = text;
        bubble.classList.add('show');
        bubbleTimeout = setTimeout(() => hideBubble(), 3500);
    }

    function hideBubble() {
        bubble.classList.remove('show');
        bubbleTimeout = null;
    }

    function hide() {
        isHidden = true;
        container.classList.remove('chibi-visible');
        container.classList.add('chibi-hidden');
        document.body.classList.remove('chibi-active');
        if (isCheering) stopCheer();
    }

    function show() {
        isHidden = false;
        container.classList.remove('chibi-hidden');
        container.classList.add('chibi-visible');
        document.body.classList.add('chibi-active');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, startCheer, stopCheer, hide, show };
})();
