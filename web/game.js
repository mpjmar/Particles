/**
 * Particles – Playable Mode Logic
 * Extends/Reuses main.js core classes
 */

const params = new URLSearchParams(window.location.search);
const playerRole = params.get('role') || 'photon'; // 'photon' or 'electron'
let playerParticle = null;
let abilityCharges = 5;
let mousePos = { row: 0, col: 0 };

// UI Elements specific to game.html
const cntCharges = document.getElementById('cnt-charges');
const gameTitle = document.getElementById('game-title');
const btnBegin = document.getElementById('btn-begin');
const overlayIcon = document.getElementById('overlay-icon');

// Initialize UI context
if (gameTitle) gameTitle.textContent = playerRole.toUpperCase() + " PILOT";
if (cntCharges) cntCharges.textContent = abilityCharges;
if (overlayIcon) overlayIcon.textContent = playerRole === 'photon' ? '🔵' : '🟠';

/**
 * Handle Mission Start
 */
if (btnBegin) {
    btnBegin.addEventListener('click', () => {
        if (!board) initGame();
        startGame();
        if (overlay) overlay.classList.add('hidden');
    });
}

/**
 * Override tick function to include player logic
 */
const originalTick = window.tick;
window.tick = function() {
    if (paused) return;
    
    // 1. Update Player position (follow mouse)
    if (playerParticle && playerParticle.life > 0) {
        // Move towards mousePos (immediate for better feel)
        playerParticle.setPos(mousePos.row, mousePos.col);
    }

    // 2. Run standard simulation logic
    if (typeof originalTick === 'function') originalTick();
    
    // 3. Update UI
    if (cntCharges) cntCharges.textContent = abilityCharges;

    // Check if player is dead
    if (playerParticle && playerParticle.life <= 0) {
        playerParticle = null;
        stopGame();
        if (overlay) {
            overlay.classList.remove('hidden');
            const msg = document.getElementById('overlay-msg');
            const sub = document.getElementById('overlay-sub');
            if (msg) msg.textContent = "MISSION FAILED";
            if (sub) sub.textContent = "Your particle was consumed by the void.";
        }
    }
};

/**
 * Handle Mouse Interaction
 */
if (canvas) {
    // Ability Activation
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Visual feedback (Ripple) - even if charges are 0
        if (renderer) renderer._spawnRipple(x, y);

        if (!logicRunning || paused || abilityCharges <= 0 || !playerParticle) return;

        abilityCharges--;
        if (cntCharges) cntCharges.textContent = abilityCharges;

        if (playerRole === 'photon') {
            // SHOCKWAVE: Kill all chasers in radius 3
            let i = elements.length;
            while(i--) {
                const ent = elements[i];
                if (ent instanceof Chaser) {
                    const dist = Position.calcDistance(playerParticle.pos, ent.pos);
                    if (dist <= 4) { // Slightly larger radius for better feel
                        ent.life = 0; 
                        if (renderer) renderer.spawnFlash(ent.col * renderer.cellSize, ent.row * renderer.cellSize, Colors.chaser, 3);
                    }
                }
            }
        } else {
            // CLONE: Spawn allied electrons
            if (renderer) renderer.spawnFlash(x, y, Colors.chaser, 4);
            
            for (let j = 0; j < 5; j++) {
                const rOffset = Math.floor(Math.random() * 5) - 2;
                const cOffset = Math.floor(Math.random() * 5) - 2;
                const r = Math.max(0, Math.min(board.rows - 1, playerParticle.row + rOffset));
                const c = Math.max(0, Math.min(board.cols - 1, playerParticle.col + cOffset));
                
                if (MovUtils.isEmpty(elements, r, c)) {
                    const clone = new Chaser(r, c);
                    clone.life = 20;
                    elements.push(clone);
                }
            }
        }
    });

    /**
     * Mouse Tracking
     */
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        if (renderer && renderer.cellSize && board) {
            const r = Math.floor(y / renderer.cellSize);
            const c = Math.floor(x / renderer.cellSize);
            
            // Boundary constraints
            mousePos.row = Math.max(0, Math.min(board.rows - 1, r));
            mousePos.col = Math.max(0, Math.min(board.cols - 1, c));
        }
    });
}

/**
 * Injected logic to spawn the player
 */
const originalInit = window.initGame;
window.initGame = function() {
    if (typeof originalInit === 'function') originalInit();
    
    // Board and Elements should be ready now
    if (!board || !elements) return;

    const row = Math.floor(board.rows / 2);
    const col = Math.floor(board.cols / 2);
    
    if (playerRole === 'photon') {
        playerParticle = new Runner(row, col);
        playerParticle.life = 200; // Increased life
    } else {
        playerParticle = new Chaser(row, col);
        playerParticle.life = 200;
    }
    
    // Replace anything at player start pos
    elements = elements.filter(e => !(e.row === row && e.col === col));
    elements.push(playerParticle);
    
    abilityCharges = 5;
    if (cntCharges) cntCharges.textContent = abilityCharges;
};

// Delayed init to ensure board is sized
setTimeout(() => {
    if (!board) initGame();
}, 200);
