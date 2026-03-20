/**
 * Particles – Playable Mode Logic
 * Extends/Reuses main.js core classes
 */

const params = new URLSearchParams(window.location.search);
const playerRole = params.get('role') || 'photon'; // 'photon' or 'electron'
let abilityCharges = 5;
const MAX_ABILITY_CHARGES = 5;

// UI Elements specific to game.html
const cntCharges = document.getElementById('cnt-charges');
const gameTitle = document.getElementById('game-title');
const btnBegin = document.getElementById('btn-begin');
const overlayIcon = document.getElementById('overlay-icon');
const inpEnemyCap = document.getElementById('inp-enemy-cap');
let enemySpawnCooldown = 0;

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

function showChargeFeedback(row, col, text = '+1 CHARGE') {
    if (!canvas || !renderer || !board) return;

    const rect = canvas.getBoundingClientRect();
    const csX = rect.width / board.cols;
    const csY = rect.height / board.rows;
    const x = rect.left + (col + 0.5) * csX;
    const y = rect.top + (row + 0.5) * csY;

    const tag = document.createElement('div');
    tag.textContent = text;
    tag.style.position = 'fixed';
    tag.style.left = `${x}px`;
    tag.style.top = `${y}px`;
    tag.style.transform = 'translate(-50%, -50%)';
    tag.style.pointerEvents = 'none';
    tag.style.fontFamily = 'Orbitron, sans-serif';
    tag.style.fontSize = '0.72rem';
    tag.style.letterSpacing = '0.08em';
    tag.style.fontWeight = '700';
    tag.style.color = '#d946ef';
    tag.style.textShadow = '0 0 12px rgba(217,70,239,0.95), 0 0 24px rgba(217,70,239,0.55)';
    tag.style.zIndex = '2000';
    tag.style.opacity = '1';
    tag.style.transition = 'transform 0.55s ease-out, opacity 0.55s ease-out';

    document.body.appendChild(tag);
    requestAnimationFrame(() => {
        tag.style.transform = 'translate(-50%, -125%)';
        tag.style.opacity = '0';
    });

    setTimeout(() => tag.remove(), 620);
}

function syncPlayableBoardState() {
    if (cntCharges) cntCharges.textContent = abilityCharges;
    if (!board || !elements) return;
    board.placeElements(elements);
    if (renderer) renderer.updateLogicState(elements, board);
    if (typeof updateStats === 'function') updateStats();
}

function getEnemyCap() {
    if (!inpEnemyCap) return 100;
    const value = parseInt(inpEnemyCap.value, 10);
    if (!Number.isFinite(value)) return 100;
    return Math.max(10, Math.min(300, value));
}

function normalizeEnemyCapInput() {
    if (!inpEnemyCap) return;
    inpEnemyCap.value = String(getEnemyCap());
}

function spawnOpposingParticles() {
    if (!board || !elements || !logicRunning || paused) return false;
    const enemyCtor = playerRole === 'photon' ? Chaser : Runner;
    const currentEnemies = elements.filter(e => e instanceof enemyCtor).length;
    const maxEnemies = getEnemyCap();
    if (currentEnemies >= maxEnemies) return false;
    if (enemySpawnCooldown > 0) {
        enemySpawnCooldown--;
        return false;
    }

    const deficit = maxEnemies - currentEnemies;
    const spawnChance = Math.min(0.22, 0.08 + (deficit / 500));
    if (Math.random() > spawnChance) return false;

    const toSpawn = (deficit > 50 && Math.random() < 0.2) ? 2 : 1;
    let spawned = 0;

    for (let n = 0; n < toSpawn; n++) {
        let attempts = 0;
        let row = 0;
        let col = 0;
        let found = false;
        while (attempts < 80) {
            row = generateRandom(0, board.rows);
            col = generateRandom(0, board.cols);
            if (MovUtils.isEmpty(elements, row, col)) {
                found = true;
                break;
            }
            attempts++;
        }

        if (!found) continue;
        const enemy = enemyCtor === Chaser ? new Chaser(row, col) : new Runner(row, col);
        enemy.life = generateRandom(12, 24);
        elements.push(enemy);
        spawned++;
    }

    if (spawned > 0) {
        enemySpawnCooldown = generateRandom(1, 4);
        syncPlayableBoardState();
        return true;
    }

    return false;
}

function processEnergyNodesForPlayable(elementsArg, boardArg) {
    // 1) Decay and remove dead nodes
    let i = elementsArg.length;
    while (i--) {
        const e = elementsArg[i];
        if (e instanceof EnergyNode) {
            e.life--;
            if (e.life <= 0) elementsArg.splice(i, 1);
        }
    }

    // 2) Random spawn (without AI auto-consume)
    const nodes = elementsArg.filter(e => e instanceof EnergyNode);
    if (nodes.length < 6 && Math.random() < 0.15) {
        let row = generateRandom(0, boardArg.rows);
        let col = generateRandom(0, boardArg.cols);
        if (MovUtils.isEmpty(elementsArg, row, col)) {
            elementsArg.push(new EnergyNode(row, col));
        }
    }
}

if (typeof EnergyManager !== 'undefined') {
    EnergyManager.processNodes = processEnergyNodesForPlayable;
}

function collectEnergyNode(predicate) {
    if (!elements || !Array.isArray(elements)) return false;

    let i = elements.length;
    while (i--) {
        const ent = elements[i];
        if (!(ent instanceof EnergyNode)) continue;
        if (!predicate(ent)) continue;

        elements.splice(i, 1);
        const prevCharges = abilityCharges;
        const chargeGain = Math.max(1, ent.energyValue || 1);
        abilityCharges = Math.min(MAX_ABILITY_CHARGES, abilityCharges + chargeGain);
        if (renderer) {
            renderer.spawnFlash(ent.col * renderer.cellSize, ent.row * renderer.cellSize, Colors.energy, 2);
        }
        const gain = abilityCharges - prevCharges;
        showChargeFeedback(ent.row, ent.col, gain > 0 ? `+${gain} CHARGE${gain > 1 ? 'S' : ''}` : 'MAX');
        EventManager.emit({ type: 'fight', row: ent.row, col: ent.col, color: Colors.energy });
        syncPlayableBoardState();
        return true;
    }

    return false;
}

function collectClickedEnergyNode(row, col) {
    return collectEnergyNode((ent) => ent.row === row && ent.col === col);
}

function usePhotonAbility(clickedRow, clickedCol, x, y) {
    let removed = false;
    let i = elements.length;
    while (i--) {
        const ent = elements[i];
        if (!(ent instanceof Chaser)) continue;
        const dist = Math.abs(ent.row - clickedRow) + Math.abs(ent.col - clickedCol);
        if (dist <= 3) {
            ent.life = 0;
            removed = true;
            if (renderer) renderer.spawnFlash(ent.col * renderer.cellSize, ent.row * renderer.cellSize, Colors.chaser, 2.2);
        }
    }
    if (renderer) {
        renderer.spawnExplosion(x, y, Colors.runner);
        renderer.spawnFlash(x, y, Colors.runner, 2.8);
    }
    return removed;
}

function useElectronAbility(clickedRow, clickedCol, x, y) {
    let spawned = false;
    for (let j = 0; j < 5; j++) {
        const rOffset = Math.floor(Math.random() * 5) - 2;
        const cOffset = Math.floor(Math.random() * 5) - 2;
        const r = Math.max(0, Math.min(board.rows - 1, clickedRow + rOffset));
        const c = Math.max(0, Math.min(board.cols - 1, clickedCol + cOffset));

        if (MovUtils.isEmpty(elements, r, c)) {
            const clone = new Chaser(r, c);
            clone.life = 20;
            clone.isPlayerClone = true;
            clone.cloneLife = 18;
            elements.push(clone);
            spawned = true;
        }
    }
    if (renderer) renderer.spawnFlash(x, y, Colors.chaser, 3.2);
    return spawned;
}

function processTemporaryElectronClones() {
    if (!elements || !Array.isArray(elements)) return false;

    let removed = false;
    let i = elements.length;
    while (i--) {
        const ent = elements[i];
        if (!(ent instanceof Chaser) || !ent.isPlayerClone) continue;

        ent.cloneLife = Math.max(0, (ent.cloneLife || 0) - 1);
        if (ent.cloneLife <= 0) {
            elements.splice(i, 1);
            removed = true;
            EventManager.emit({ type: 'death', row: ent.row, col: ent.col, color: Colors.chaser });
        }
    }

    return removed;
}

/**
 * Override tick function to include player logic
 */
window.tick = function() {
    if (paused || !elements || !board || !renderer) return;

    for (const e of elements) {
        if (e instanceof Chaser) e.setTarget(elements);
        if (e instanceof Runner) e.setTarget(elements);
    }

    Game.playGame(elements, board);

    const prevLen = elements.length;
    let i = elements.length;
    while (i--) {
        const e = elements[i];
        if ((e instanceof Runner || e instanceof Chaser) && e.life <= 0) {
            elements.splice(i, 1);
        }
    }

    const clonesExpired = processTemporaryElectronClones();
    const erased = (elements.length < prevLen) || clonesExpired;

    if (logicRunning) spawnOpposingParticles();

    if (erased) idleMoves = 0;
    else idleMoves++;
    turn++;

    board.placeElements(elements);
    renderer.updateLogicState(elements, board);
    if (typeof updateStats === 'function') updateStats();
    if (cntCharges) cntCharges.textContent = abilityCharges;
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
		
        if (board && renderer && renderer.cellSize) {
            const clickedRow = Math.max(0, Math.min(board.rows - 1, Math.floor(y / renderer.cellSize)));
            const clickedCol = Math.max(0, Math.min(board.cols - 1, Math.floor(x / renderer.cellSize)));
            if (collectClickedEnergyNode(clickedRow, clickedCol)) return;

            if (!logicRunning || paused || abilityCharges <= 0) return;

            abilityCharges--;
            if (playerRole === 'photon') {
                usePhotonAbility(clickedRow, clickedCol, x, y);
            } else {
                useElectronAbility(clickedRow, clickedCol, x, y);
            }

            let j = elements.length;
            while (j--) {
                const ent = elements[j];
                if ((ent instanceof Runner || ent instanceof Chaser) && ent.life <= 0) elements.splice(j, 1);
            }
            syncPlayableBoardState();
            return;
        }
    });
}

if (inpEnemyCap) {
    inpEnemyCap.addEventListener('change', normalizeEnemyCapInput);
    inpEnemyCap.addEventListener('blur', normalizeEnemyCapInput);
}

/**
 * Injected logic to spawn the player
 */
const originalInit = window.initGame;
window.initGame = function() {
    if (typeof originalInit === 'function') originalInit();

    abilityCharges = 5;
	enemySpawnCooldown = 0;
	normalizeEnemyCapInput();
    syncPlayableBoardState();
};

// Delayed init to ensure board is sized
setTimeout(() => {
    if (!board) initGame();
}, 200);
