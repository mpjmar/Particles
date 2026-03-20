/**
 * Particles – Playable Mode Logic
 * Extends/Reuses main.js core classes
 */

const params = new URLSearchParams(window.location.search);
const playerRole = params.get('role') || 'photon'; // 'photon' or 'electron'
let abilityCharges = 5;
const MAX_ABILITY_CHARGES = 5;
const originalTick = window.tick;
const originalInit = window.initGame;
const originalStartGame = window.startGame;
const originalPauseGame = window.pauseGame;
const originalStopGame = window.stopGame;
const originalResetGame = window.resetGame;

// UI Elements specific to game.html
const cntCharges = document.getElementById('cnt-charges');
const gameTitle = document.getElementById('game-title');
const btnBegin = document.getElementById('btn-begin');
const overlayIcon = document.getElementById('overlay-icon');
const inpEnemyCap = document.getElementById('inp-enemy-cap');
const inpSpawnPace = document.getElementById('inp-spawn-pace');
const boardWrap = document.querySelector('.board-wrap');
let enemySpawnCooldown = 0;
let playableModeDisposed = false;
let hudStatusTimeoutId = null;

const abilityHud = document.createElement('div');
abilityHud.setAttribute('id', 'playable-ability-hud');
abilityHud.style.position = 'absolute';
abilityHud.style.right = '16px';
abilityHud.style.bottom = '16px';
abilityHud.style.padding = '10px 14px';
abilityHud.style.borderRadius = '14px';
abilityHud.style.background = 'rgba(2, 6, 23, 0.72)';
abilityHud.style.border = '1px solid rgba(148, 163, 184, 0.35)';
abilityHud.style.backdropFilter = 'blur(6px)';
abilityHud.style.fontFamily = 'Orbitron, sans-serif';
abilityHud.style.color = '#e2e8f0';
abilityHud.style.letterSpacing = '0.06em';
abilityHud.style.fontSize = '0.74rem';
abilityHud.style.zIndex = '40';
abilityHud.style.minWidth = '160px';
abilityHud.style.pointerEvents = 'none';

const abilityHudTitle = document.createElement('div');
abilityHudTitle.style.fontWeight = '700';
abilityHudTitle.style.marginBottom = '4px';

const abilityHudCharges = document.createElement('div');
abilityHudCharges.style.fontWeight = '900';
abilityHudCharges.style.fontSize = '0.92rem';

const abilityHudStatus = document.createElement('div');
abilityHudStatus.style.marginTop = '4px';
abilityHudStatus.style.color = '#94a3b8';
abilityHudStatus.style.minHeight = '1.1em';

abilityHud.appendChild(abilityHudTitle);
abilityHud.appendChild(abilityHudCharges);
abilityHud.appendChild(abilityHudStatus);

if (boardWrap) {
    if (getComputedStyle(boardWrap).position === 'static') boardWrap.style.position = 'relative';
    boardWrap.appendChild(abilityHud);
}

// Initialize UI context
if (gameTitle) gameTitle.textContent = playerRole.toUpperCase() + " PILOT";
if (cntCharges) cntCharges.textContent = abilityCharges;
if (overlayIcon) overlayIcon.textContent = playerRole === 'photon' ? '🔵' : '🟠';

function setHudStatus(text, color = '#94a3b8', ttl = 1200) {
    abilityHudStatus.textContent = text;
    abilityHudStatus.style.color = color;

    if (hudStatusTimeoutId !== null) clearTimeout(hudStatusTimeoutId);
    hudStatusTimeoutId = setTimeout(() => {
        abilityHudStatus.textContent = '';
        abilityHudStatus.style.color = '#94a3b8';
    }, ttl);
}

function updateAbilityHud() {
    const roleLabel = playerRole === 'photon' ? 'Shockwave' : 'Clone Swarm';
    abilityHudTitle.textContent = `${roleLabel}`;
    abilityHudCharges.textContent = `Charges ${abilityCharges}/${MAX_ABILITY_CHARGES}`;

    if (!logicRunning) {
        abilityHudStatus.textContent = 'Mission idle';
    } else if (paused) {
        abilityHudStatus.textContent = 'Simulation paused';
    } else if (abilityCharges <= 0) {
        abilityHudStatus.textContent = 'Recharge from energy nodes';
    }
}

updateAbilityHud();

/**
 * Handle Mission Start
 */
function onMissionBeginClick() {
    if (!board) initGame();
    startGame();
    if (overlay) overlay.classList.add('hidden');
}

if (btnBegin) {
    btnBegin.addEventListener('click', onMissionBeginClick);
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
    updateAbilityHud();
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

function getSpawnPace() {
    if (!inpSpawnPace) return 'normal';
    const value = String(inpSpawnPace.value || 'normal').toLowerCase();
    if (value === 'slow' || value === 'aggressive') return value;
    return 'normal';
}

function getSpawnPaceConfig() {
    const pace = getSpawnPace();
    if (pace === 'slow') {
        return {
            minAliveFactor: 0.82,
            chanceBias: -0.08,
            chanceScale: 0.82,
            emergencyBurstDelta: -1,
            cooldownBias: 1
        };
    }
    if (pace === 'aggressive') {
        return {
            minAliveFactor: 1.25,
            chanceBias: 0.12,
            chanceScale: 1.32,
            emergencyBurstDelta: 1,
            cooldownBias: -1
        };
    }
    return {
        minAliveFactor: 1,
        chanceBias: 0,
        chanceScale: 1,
        emergencyBurstDelta: 0,
        cooldownBias: 0
    };
}

function onSpawnPaceChange() {
    const pace = getSpawnPace();
    const label = pace === 'aggressive' ? 'Aggressive spawn pace' : (pace === 'slow' ? 'Slow spawn pace' : 'Normal spawn pace');
    setHudStatus(label, '#38bdf8', 900);
}

function spawnOpposingParticles() {
    if (!board || !elements || !logicRunning || paused) return false;
    const enemyCtor = playerRole === 'photon' ? Chaser : Runner;
    const currentEnemies = elements.filter(e => e instanceof enemyCtor).length;
    const maxEnemies = getEnemyCap();
    if (currentEnemies >= maxEnemies) return false;
    const paceCfg = getSpawnPaceConfig();

    const baseAliveFactor = playerRole === 'photon' ? 0.2 : 0.16;
    const minAliveTarget = Math.max(6, Math.floor(maxEnemies * baseAliveFactor * paceCfg.minAliveFactor));
    const emergencyMode = currentEnemies <= Math.max(2, Math.floor(minAliveTarget * 0.35));

    if (enemySpawnCooldown > 0) {
        enemySpawnCooldown--;
        if (!emergencyMode) return false;
    }

    const deficit = maxEnemies - currentEnemies;
    if (!emergencyMode) {
        const lowPopulationBoost = currentEnemies < minAliveTarget ? 0.18 : 0;
        const baseChance = 0.12 + (deficit / 360) + lowPopulationBoost;
        const spawnChance = Math.min(0.75, Math.max(0.04, baseChance * paceCfg.chanceScale + paceCfg.chanceBias));
        if (Math.random() > spawnChance) return false;
    }

    let toSpawn = 1;
    if (emergencyMode) {
        const emergencyGap = minAliveTarget - currentEnemies;
        toSpawn = Math.max(2, Math.min(6, emergencyGap + paceCfg.emergencyBurstDelta));
    } else if (currentEnemies < minAliveTarget) {
        toSpawn = Math.min(4, Math.max(1, Math.ceil((minAliveTarget - currentEnemies) / 4)));
    } else if (deficit > 50 && Math.random() < 0.25) {
        toSpawn = 2;
    }

    toSpawn = Math.min(toSpawn, maxEnemies - currentEnemies);
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
        enemySpawnCooldown = emergencyMode
            ? generateRandom(0, 2)
            : (currentEnemies < minAliveTarget ? generateRandom(1, 3) : generateRandom(1, 4));
        enemySpawnCooldown = Math.max(0, enemySpawnCooldown + paceCfg.cooldownBias);
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
        if (gain > 0) setHudStatus(`+${gain} charge${gain > 1 ? 's' : ''}`, '#22d3ee');
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
    const tickStartMs = performance.now();
    if (paused || !elements || !board || !renderer) return;

    const runners = [];
    const chasers = [];
    const energyNodes = [];
    for (const e of elements) {
        if (e instanceof Runner) runners.push(e);
        else if (e instanceof Chaser) chasers.push(e);
        else if (e instanceof EnergyNode) energyNodes.push(e);
    }

    for (const e of elements) {
        if (e instanceof Chaser) e.setTarget(elements, runners, energyNodes);
        if (e instanceof Runner) e.setTarget(elements, chasers, energyNodes);
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
    updateAbilityHud();
    if (typeof window.__recordLogicFrame === 'function') {
        window.__recordLogicFrame(performance.now() - tickStartMs);
    }
};

/**
 * Handle Mouse Interaction
 */
function onCanvasMouseDown(e) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (board && renderer && renderer.cellSize) {
        const clickedRow = Math.max(0, Math.min(board.rows - 1, Math.floor(y / renderer.cellSize)));
        const clickedCol = Math.max(0, Math.min(board.cols - 1, Math.floor(x / renderer.cellSize)));
        if (collectClickedEnergyNode(clickedRow, clickedCol)) return;

        if (!logicRunning || paused) return;
        if (abilityCharges <= 0) {
            showChargeFeedback(clickedRow, clickedCol, 'NO CHARGE');
            setHudStatus('No charges available', '#f97316', 900);
            return;
        }

        abilityCharges--;
        if (playerRole === 'photon') {
            usePhotonAbility(clickedRow, clickedCol, x, y);
        } else {
            useElectronAbility(clickedRow, clickedCol, x, y);
        }

        setHudStatus('Ability activated', '#22c55e', 900);

        let j = elements.length;
        while (j--) {
            const ent = elements[j];
            if ((ent instanceof Runner || ent instanceof Chaser) && ent.life <= 0) elements.splice(j, 1);
        }
        syncPlayableBoardState();
    }
}

if (canvas) {
    // Ability activation in playable mode
    canvas.addEventListener('mousedown', onCanvasMouseDown);
}

if (inpEnemyCap) {
    inpEnemyCap.addEventListener('change', normalizeEnemyCapInput);
    inpEnemyCap.addEventListener('blur', normalizeEnemyCapInput);
}

if (inpSpawnPace) {
    inpSpawnPace.addEventListener('change', onSpawnPaceChange);
}

function disposePlayableMode() {
    if (playableModeDisposed) return;
    playableModeDisposed = true;

    if (btnBegin) btnBegin.removeEventListener('click', onMissionBeginClick);
    if (canvas) canvas.removeEventListener('mousedown', onCanvasMouseDown);
    if (inpEnemyCap) {
        inpEnemyCap.removeEventListener('change', normalizeEnemyCapInput);
        inpEnemyCap.removeEventListener('blur', normalizeEnemyCapInput);
    }
    if (inpSpawnPace) inpSpawnPace.removeEventListener('change', onSpawnPaceChange);
    if (hudStatusTimeoutId !== null) {
        clearTimeout(hudStatusTimeoutId);
        hudStatusTimeoutId = null;
    }
    if (abilityHud.parentNode) abilityHud.parentNode.removeChild(abilityHud);
    if (typeof originalTick === 'function') window.tick = originalTick;
    if (typeof originalInit === 'function') window.initGame = originalInit;
    if (typeof originalStartGame === 'function') window.startGame = originalStartGame;
    if (typeof originalPauseGame === 'function') window.pauseGame = originalPauseGame;
    if (typeof originalStopGame === 'function') window.stopGame = originalStopGame;
    if (typeof originalResetGame === 'function') window.resetGame = originalResetGame;
}

window.addEventListener('pagehide', disposePlayableMode, { once: true });
window.addEventListener('beforeunload', disposePlayableMode, { once: true });

/**
 * Injected logic to spawn the player
 */
window.initGame = function() {
    if (typeof originalInit === 'function') originalInit();

    abilityCharges = 5;
	enemySpawnCooldown = 0;
	normalizeEnemyCapInput();
    if (inpSpawnPace && !inpSpawnPace.value) inpSpawnPace.value = 'normal';
    setHudStatus('Mission initialized', '#38bdf8', 700);
    syncPlayableBoardState();
};

window.startGame = function() {
    if (typeof originalStartGame === 'function') originalStartGame();
    updateAbilityHud();
};

window.pauseGame = function() {
    if (typeof originalPauseGame === 'function') originalPauseGame();
    updateAbilityHud();
};

window.stopGame = function() {
    if (typeof originalStopGame === 'function') originalStopGame();
    updateAbilityHud();
};

window.resetGame = function() {
    if (typeof originalResetGame === 'function') originalResetGame();
    abilityCharges = MAX_ABILITY_CHARGES;
    enemySpawnCooldown = 0;
    updateAbilityHud();
};

// Delayed init to ensure board is sized
setTimeout(() => {
    if (!board) initGame();
}, 200);
