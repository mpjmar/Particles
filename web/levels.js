/**
 * Particles – Levels Mode Logic
 * Separate campaign flow from playable survival mode.
 */

(function () {

const params = new URLSearchParams(window.location.search);
const playerRole = params.get('role') || 'photon';
let abilityCharges = 5;
const MAX_ABILITY_CHARGES = 5;

const LEVELS = [
    {
        name: 'Boot Sector',
        targetTurns: 100,
        enemyCap: 68,
        enemyLifeMin: 9,
        enemyLifeMax: 16,
        pace: 'slow',
        counts: { runners: 26, chasers: 24, obstacles: 34, healers: 7, speeders: 4 }
    },
    {
        name: 'Ion Drift',
        targetTurns: 150,
        enemyCap: 92,
        enemyLifeMin: 10,
        enemyLifeMax: 19,
        pace: 'slow',
        counts: { runners: 30, chasers: 30, obstacles: 40, healers: 6, speeders: 5 }
    },
    {
        name: 'Flux Corridor',
        targetTurns: 200,
        enemyCap: 122,
        enemyLifeMin: 12,
        enemyLifeMax: 22,
        pace: 'normal',
        counts: { runners: 36, chasers: 38, obstacles: 48, healers: 5, speeders: 6 }
    },
    {
        name: 'Pressure Node',
        targetTurns: 250,
        enemyCap: 150,
        enemyLifeMin: 14,
        enemyLifeMax: 27,
        pace: 'aggressive',
        counts: { runners: 42, chasers: 48, obstacles: 58, healers: 4, speeders: 8 }
    },
    {
        name: 'Omega Core',
        targetTurns: 300,
        enemyCap: 190,
        enemyLifeMin: 17,
        enemyLifeMax: 33,
        pace: 'aggressive',
        counts: { runners: 50, chasers: 62, obstacles: 70, healers: 4, speeders: 10 }
    }
];

const originalTick = window.tick;
const originalInit = window.initGame;
const originalStartGame = window.startGame;
const originalPauseGame = window.pauseGame;
const originalStopGame = window.stopGame;
const originalResetGame = window.resetGame;
const originalShowWinner = window.showWinner;

const cntCharges = document.getElementById('cnt-charges');
const cntLevel = document.getElementById('cnt-level');
const cntObjective = document.getElementById('cnt-objective');
const gameTitle = document.getElementById('game-title');
let btnBegin = document.getElementById('btn-begin');
let btnOverlayReset = document.getElementById('btn-overlay-reset');
let btnPauseControl = document.getElementById('btn-pause');
let btnResetControl = document.getElementById('btn-reset');
const overlayIcon = document.getElementById('overlay-icon');
const boardWrap = document.querySelector('.board-wrap');
const sidebar = document.querySelector('.sidebar');
const inpRows = document.getElementById('inp-rows');
const inpCols = document.getElementById('inp-cols');
const inpRun = document.getElementById('inp-run');
const inpCha = document.getElementById('inp-cha');
const inpObs = document.getElementById('inp-obs');
const inpHea = document.getElementById('inp-hea');
const inpSpe = document.getElementById('inp-spe');

const LEVEL_ROWS = 40;
const LEVEL_COLS = 60;

let enemySpawnCooldown = 0;
let noEnemySpawnTicks = 0;
let levelsDisposed = false;
let hudStatusTimeoutId = null;
let currentLevel = 0;
let levelTurnStart = 0;
let pendingLevelAdvance = false;
let pendingLevelIndex = -1;
let reserveCharges = 1;
const canvasInputEvent = 'click';

function setInputValue(input, value) {
    if (!input) return;
    input.value = String(value);
}

function applyLevelDensityToInputs(levelCfg) {
    const density = levelCfg && levelCfg.counts ? levelCfg.counts : {};
    setInputValue(inpRows, LEVEL_ROWS);
    setInputValue(inpCols, LEVEL_COLS);
    setInputValue(inpRun, density.runners ?? 20);
    setInputValue(inpCha, density.chasers ?? 20);
    setInputValue(inpObs, density.obstacles ?? 40);
    setInputValue(inpHea, density.healers ?? 6);
    setInputValue(inpSpe, density.speeders ?? 5);
}

const topBarInfo = document.querySelector('.top-bar-info');
const levelBadge = document.createElement('span');
levelBadge.id = 'cnt-level-badge';
levelBadge.className = 'logo-sub';
levelBadge.style.marginLeft = '10px';
if (topBarInfo) topBarInfo.appendChild(levelBadge);

const abilityHud = document.createElement('div');
abilityHud.setAttribute('id', 'levels-ability-hud');
abilityHud.style.position = 'static';
abilityHud.style.padding = '12px 16px';
abilityHud.style.borderRadius = '16px';
abilityHud.style.background = 'linear-gradient(180deg, rgba(2, 6, 23, 0.88), rgba(15, 23, 42, 0.84))';
abilityHud.style.border = '1px solid rgba(56, 189, 248, 0.55)';
abilityHud.style.boxShadow = '0 10px 28px rgba(2, 132, 199, 0.25), inset 0 0 0 1px rgba(125, 211, 252, 0.2)';
abilityHud.style.backdropFilter = 'blur(6px)';
abilityHud.style.fontFamily = 'Orbitron, sans-serif';
abilityHud.style.color = '#e2e8f0';
abilityHud.style.letterSpacing = '0.06em';
abilityHud.style.fontSize = '0.74rem';
abilityHud.style.zIndex = '5';
abilityHud.style.width = '100%';
abilityHud.style.maxWidth = '100%';
abilityHud.style.marginTop = '8px';
abilityHud.style.pointerEvents = 'auto';

const abilityHudTitle = document.createElement('div');
abilityHudTitle.style.fontWeight = '700';
abilityHudTitle.style.marginBottom = '4px';

const abilityHudCharges = document.createElement('div');
abilityHudCharges.style.fontWeight = '900';
abilityHudCharges.style.fontSize = '1.1rem';
abilityHudCharges.style.marginBottom = '6px';

const abilityHudReserve = document.createElement('div');
abilityHudReserve.style.display = 'flex';
abilityHudReserve.style.alignItems = 'center';
abilityHudReserve.style.justifyContent = 'space-between';
abilityHudReserve.style.gap = '8px';
abilityHudReserve.style.marginTop = '2px';
abilityHudReserve.style.marginBottom = '4px';

const reserveLabel = document.createElement('div');
reserveLabel.style.color = '#93c5fd';
reserveLabel.style.fontSize = '0.66rem';
reserveLabel.textContent = 'RESERVE LOCK';

const reserveControls = document.createElement('div');
reserveControls.style.display = 'flex';
reserveControls.style.alignItems = 'center';
reserveControls.style.gap = '6px';

const reserveDownBtn = document.createElement('button');
reserveDownBtn.type = 'button';
reserveDownBtn.textContent = '-';
reserveDownBtn.style.width = '22px';
reserveDownBtn.style.height = '22px';
reserveDownBtn.style.borderRadius = '6px';
reserveDownBtn.style.border = '1px solid rgba(125, 211, 252, 0.5)';
reserveDownBtn.style.background = 'rgba(15, 23, 42, 0.8)';
reserveDownBtn.style.color = '#e2e8f0';
reserveDownBtn.style.cursor = 'pointer';

const reserveValue = document.createElement('div');
reserveValue.style.minWidth = '24px';
reserveValue.style.textAlign = 'center';
reserveValue.style.fontSize = '0.8rem';
reserveValue.style.fontWeight = '800';
reserveValue.style.color = '#7dd3fc';

const reserveUpBtn = document.createElement('button');
reserveUpBtn.type = 'button';
reserveUpBtn.textContent = '+';
reserveUpBtn.style.width = '22px';
reserveUpBtn.style.height = '22px';
reserveUpBtn.style.borderRadius = '6px';
reserveUpBtn.style.border = '1px solid rgba(125, 211, 252, 0.5)';
reserveUpBtn.style.background = 'rgba(15, 23, 42, 0.8)';
reserveUpBtn.style.color = '#e2e8f0';
reserveUpBtn.style.cursor = 'pointer';

reserveControls.appendChild(reserveDownBtn);
reserveControls.appendChild(reserveValue);
reserveControls.appendChild(reserveUpBtn);
abilityHudReserve.appendChild(reserveLabel);
abilityHudReserve.appendChild(reserveControls);

const abilityHudStatus = document.createElement('div');
abilityHudStatus.style.marginTop = '4px';
abilityHudStatus.style.color = '#94a3b8';
abilityHudStatus.style.minHeight = '1.1em';
abilityHudStatus.style.fontSize = '0.66rem';

abilityHud.appendChild(abilityHudTitle);
abilityHud.appendChild(abilityHudCharges);
abilityHud.appendChild(abilityHudReserve);
abilityHud.appendChild(abilityHudStatus);

if (sidebar) sidebar.appendChild(abilityHud);
else if (boardWrap) {
    if (getComputedStyle(boardWrap).position === 'static') boardWrap.style.position = 'relative';
    boardWrap.appendChild(abilityHud);
}

if (gameTitle) gameTitle.textContent = playerRole.toUpperCase() + ' PILOT';
if (overlayIcon) overlayIcon.textContent = playerRole === 'photon' ? '🔵' : '🟠';
if (cntCharges) cntCharges.textContent = String(abilityCharges);

function getLevelConfig() {
    return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, currentLevel))];
}

function getLevelName(index) {
    const safeIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    return LEVELS[safeIndex].name || `Level ${safeIndex + 1}`;
}

function getAllyCtor() {
    return playerRole === 'photon' ? Runner : Chaser;
}

function getEnemyCtor() {
    return playerRole === 'photon' ? Chaser : Runner;
}

function stripElementListenersByClone(el) {
    if (!el || !el.parentNode) return el;
    const cloned = el.cloneNode(true);
    el.parentNode.replaceChild(cloned, el);
    return cloned;
}

function onPauseCampaignClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (typeof window.pauseGame === 'function') window.pauseGame();
}

function setHudStatus(text, color = '#94a3b8', ttl = 1200) {
    abilityHudStatus.textContent = text;
    abilityHudStatus.style.color = color;

    if (hudStatusTimeoutId !== null) clearTimeout(hudStatusTimeoutId);
    hudStatusTimeoutId = setTimeout(() => {
        abilityHudStatus.textContent = '';
        abilityHudStatus.style.color = '#94a3b8';
    }, ttl);
}

function clampReserveCharges() {
    reserveCharges = Math.max(0, Math.min(MAX_ABILITY_CHARGES - 1, reserveCharges));
}

function setReserveCharges(next) {
    reserveCharges = next;
    clampReserveCharges();
    updateLevelHud();
}

function onReserveDownClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setReserveCharges(reserveCharges - 1);
}

function onReserveUpClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setReserveCharges(reserveCharges + 1);
}

function onReserveHotkey(e) {
    if (!e || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === '[') {
        e.preventDefault();
        setReserveCharges(reserveCharges - 1);
    } else if (e.key === ']') {
        e.preventDefault();
        setReserveCharges(reserveCharges + 1);
    }
}

function updateLevelHud() {
    const cfg = getLevelConfig();
    const progress = Math.max(0, turn - levelTurnStart);
    const clampedProgress = Math.min(cfg.targetTurns, progress);
    const usableCharges = Math.max(0, abilityCharges - reserveCharges);

    if (cntLevel) cntLevel.textContent = String(currentLevel + 1);
    if (cntObjective) cntObjective.textContent = `${clampedProgress}/${cfg.targetTurns}`;
    if (cntCharges) {
        cntCharges.textContent = String(abilityCharges);
        cntCharges.style.color = usableCharges <= 0 ? '#f97316' : '#d946ef';
        cntCharges.style.textShadow = usableCharges <= 0
            ? '0 0 10px rgba(249,115,22,0.7)'
            : '0 0 12px rgba(217,70,239,0.85)';
        cntCharges.style.fontWeight = '900';
    }
    levelBadge.textContent = `LEVEL ${currentLevel + 1}/${LEVELS.length}`;

    const roleLabel = playerRole === 'photon' ? 'Shockwave' : 'Clone Swarm';
    abilityHudTitle.textContent = `${roleLabel}`;
    abilityHudCharges.textContent = `Charges ${abilityCharges}/${MAX_ABILITY_CHARGES}  |  Spendable ${usableCharges}`;
    abilityHudCharges.style.color = usableCharges <= 0 ? '#fb923c' : '#e2e8f0';
    reserveValue.textContent = String(reserveCharges);

    if (!logicRunning) {
        abilityHudStatus.textContent = `Level ${currentLevel + 1} ready`;
    } else if (paused) {
        abilityHudStatus.textContent = 'Simulation paused';
    } else if (abilityCharges <= reserveCharges) {
        abilityHudStatus.textContent = `Reserve lock active (${reserveCharges})`;
    } else if (abilityCharges <= 0) {
        abilityHudStatus.textContent = 'Recharge from energy nodes';
    } else {
        abilityHudStatus.textContent = 'Tap nodes to refill charges';
    }
}

function restartCampaignFromOverlay(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (pendingLevelAdvance) {
        if (pendingLevelIndex < 0 || pendingLevelIndex >= LEVELS.length) return;

        currentLevel = pendingLevelIndex;
        pendingLevelAdvance = false;
        pendingLevelIndex = -1;

        applyLevelDensityToInputs(getLevelConfig());
        reinforceLevelDensity(getLevelConfig());
        levelTurnStart = turn;
        enemySpawnCooldown = 0;
        if (currentLevel > 0) {
            abilityCharges = Math.min(MAX_ABILITY_CHARGES, abilityCharges + 1);
        }

        if (paused && typeof window.pauseGame === 'function') window.pauseGame();
        if (!logicRunning && typeof window.startGame === 'function') window.startGame();
        setHudStatus(`${getLevelName(currentLevel)} engaged`, '#38bdf8', 1000);
        syncLevelsBoardState(true);
        if (overlay) overlay.classList.add('hidden');
        return;
    }

    if (typeof window.resetGame === 'function') window.resetGame();
    else if (typeof window.initGame === 'function') window.initGame();

    if (typeof window.startGame === 'function') window.startGame();
    if (overlay) overlay.classList.add('hidden');
}

if (btnBegin) btnBegin.addEventListener('click', restartCampaignFromOverlay);
if (btnOverlayReset) btnOverlayReset.addEventListener('click', restartCampaignFromOverlay);

btnBegin = stripElementListenersByClone(btnBegin);
btnOverlayReset = stripElementListenersByClone(btnOverlayReset);
btnPauseControl = stripElementListenersByClone(btnPauseControl);
btnResetControl = stripElementListenersByClone(btnResetControl);

if (btnBegin) btnBegin.addEventListener('click', restartCampaignFromOverlay);
if (btnOverlayReset) btnOverlayReset.addEventListener('click', restartCampaignFromOverlay);
if (btnPauseControl) btnPauseControl.addEventListener('click', onPauseCampaignClick);
if (btnResetControl) btnResetControl.addEventListener('click', restartCampaignFromOverlay);
reserveDownBtn.addEventListener('click', onReserveDownClick);
reserveUpBtn.addEventListener('click', onReserveUpClick);
window.addEventListener('keydown', onReserveHotkey);

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

function syncLevelsBoardState(forceStats = false) {
    if (cntCharges) cntCharges.textContent = String(abilityCharges);
    if (!board || !elements) return;
    board.placeElements(elements);
    if (renderer) renderer.updateLogicState(elements, board);
    if (typeof updateStats === 'function') updateStats(forceStats);
    updateLevelHud();
}

function spawnEntitiesIntoBoard(Ctor, amount, factory) {
    if (!board || !Array.isArray(elements) || amount <= 0) return 0;

    let created = 0;
    for (let i = 0; i < amount; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 120; attempt++) {
            const row = generateRandom(0, board.rows);
            const col = generateRandom(0, board.cols);
            if (!MovUtils.isEmpty(elements, row, col)) continue;

            const ent = factory ? factory(row, col) : new Ctor(row, col);
            elements.push(ent);
            created++;
            placed = true;
            break;
        }
        if (!placed) break;
    }

    return created;
}

function clearObstaclesFromBoard() {
    if (!Array.isArray(elements)) return;
    let i = elements.length;
    while (i--) {
        if (elements[i] instanceof Obstacle) elements.splice(i, 1);
    }
}

function addPatternPoint(points, used, row, col) {
    if (!board) return;
    if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) return;
    const key = `${row},${col}`;
    if (used.has(key)) return;
    used.add(key);
    points.push({ row, col });
}

function buildObstaclePattern(levelIndex) {
    if (!board) return [];
    const points = [];
    const used = new Set();
    const centerRow = Math.floor(board.rows / 2);
    const centerCol = Math.floor(board.cols / 2);

    if (levelIndex === 0) {
        // Level 1: central ring.
        const top = Math.max(2, centerRow - 6);
        const bottom = Math.min(board.rows - 3, centerRow + 6);
        const left = Math.max(2, centerCol - 10);
        const right = Math.min(board.cols - 3, centerCol + 10);
        for (let c = left; c <= right; c++) {
            addPatternPoint(points, used, top, c);
            addPatternPoint(points, used, bottom, c);
        }
        for (let r = top + 1; r < bottom; r++) {
            addPatternPoint(points, used, r, left);
            addPatternPoint(points, used, r, right);
        }
    } else if (levelIndex === 1) {
        // Level 2: dual diagonals.
        const usable = Math.min(board.rows - 4, board.cols - 8);
        for (let i = 0; i < usable; i += 2) {
            addPatternPoint(points, used, 2 + i, 4 + i);
            addPatternPoint(points, used, 2 + i, board.cols - 5 - i);
        }
    } else if (levelIndex === 2) {
        // Level 3: corridor with side gates.
        const leftWall = Math.max(6, centerCol - 8);
        const rightWall = Math.min(board.cols - 7, centerCol + 8);
        for (let r = 2; r < board.rows - 2; r++) {
            if (r % 9 === 0 || r % 9 === 1) continue;
            addPatternPoint(points, used, r, leftWall);
            addPatternPoint(points, used, r, rightWall);
        }
    } else if (levelIndex === 3) {
        // Level 4: zigzag bands.
        for (let r = 5; r < board.rows - 5; r += 6) {
            for (let c = 3; c < board.cols - 3; c++) {
                if ((c + r) % 4 === 0) addPatternPoint(points, used, r, c);
            }
        }
    } else {
        // Level 5: concentric boxes near core.
        const layers = [
            { tr: centerRow - 11, br: centerRow + 11, lc: centerCol - 18, rc: centerCol + 18 },
            { tr: centerRow - 7, br: centerRow + 7, lc: centerCol - 12, rc: centerCol + 12 },
            { tr: centerRow - 3, br: centerRow + 3, lc: centerCol - 6, rc: centerCol + 6 }
        ];
        for (const layer of layers) {
            const tr = Math.max(2, layer.tr);
            const br = Math.min(board.rows - 3, layer.br);
            const lc = Math.max(2, layer.lc);
            const rc = Math.min(board.cols - 3, layer.rc);
            for (let c = lc; c <= rc; c++) {
                addPatternPoint(points, used, tr, c);
                addPatternPoint(points, used, br, c);
            }
            for (let r = tr + 1; r < br; r++) {
                addPatternPoint(points, used, r, lc);
                addPatternPoint(points, used, r, rc);
            }
        }
    }

    return points;
}

function applyObstaclePattern(levelIndex, targetObstacles) {
    if (!board || !Array.isArray(elements)) return;

    clearObstaclesFromBoard();
    const points = buildObstaclePattern(levelIndex);
    let placed = 0;

    for (const p of points) {
        if (placed >= targetObstacles) break;
        if (!MovUtils.isEmpty(elements, p.row, p.col)) continue;
        elements.push(new Obstacle(p.row, p.col));
        placed++;
    }

    const remaining = Math.max(0, targetObstacles - placed);
    if (remaining > 0) spawnEntitiesIntoBoard(Obstacle, remaining);
}

function reinforceLevelDensity(levelCfg) {
    if (!board || !Array.isArray(elements) || !levelCfg || !levelCfg.counts) return;

    const density = levelCfg.counts;
    const runnerCount = elements.filter(e => e instanceof Runner).length;
    const chaserCount = elements.filter(e => e instanceof Chaser).length;
    const healerCount = elements.filter(e => e instanceof Healer).length;
    const speederCount = elements.filter(e => e instanceof Speeder).length;

    const addRunners = Math.max(0, density.runners - runnerCount);
    const addChasers = Math.max(0, density.chasers - chaserCount);
    const addHealers = Math.max(0, density.healers - healerCount);
    const addSpeeders = Math.max(0, density.speeders - speederCount);

    spawnEntitiesIntoBoard(Runner, addRunners);
    spawnEntitiesIntoBoard(Chaser, addChasers);
    applyObstaclePattern(currentLevel, density.obstacles);
    spawnEntitiesIntoBoard(Healer, addHealers, (row, col) => new Healer(row, col, generateRandom(2, 7)));
    spawnEntitiesIntoBoard(Speeder, addSpeeders);
}

function getPaceConfig(pace) {
    if (pace === 'slow') {
        return { chanceScale: 0.8, chanceBias: -0.05, cooldownBias: 1, burstBias: -1 };
    }
    if (pace === 'aggressive') {
        return { chanceScale: 1.35, chanceBias: 0.12, cooldownBias: -1, burstBias: 1 };
    }
    return { chanceScale: 1, chanceBias: 0, cooldownBias: 0, burstBias: 0 };
}

function spawnOpposingParticlesByLevel() {
    if (!board || !elements || !logicRunning || paused) return false;

    const cfg = getLevelConfig();
    const paceCfg = getPaceConfig(cfg.pace);
    const enemyCtor = getEnemyCtor();
    const currentEnemies = elements.filter(e => e instanceof enemyCtor).length;

    if (currentEnemies >= cfg.enemyCap) return false;

    const minAliveTarget = Math.max(5, Math.floor(cfg.enemyCap * 0.2));
    const emergencyMode = currentEnemies <= Math.max(2, Math.floor(minAliveTarget * 0.35));
    const forcedTopUp = noEnemySpawnTicks >= 8 || (currentEnemies < minAliveTarget && noEnemySpawnTicks >= 4);

    if (enemySpawnCooldown > 0) {
        enemySpawnCooldown--;
        if (!emergencyMode) return false;
    }

    const deficit = cfg.enemyCap - currentEnemies;
    if (!emergencyMode && !forcedTopUp) {
        const lowPopulationBoost = currentEnemies < minAliveTarget ? 0.2 : 0;
        const baseChance = 0.12 + (deficit / 340) + lowPopulationBoost;
        const spawnChance = Math.min(0.78, Math.max(0.04, baseChance * paceCfg.chanceScale + paceCfg.chanceBias));
        if (Math.random() > spawnChance) return false;
    }

    let toSpawn = 1;
    if (emergencyMode) {
        toSpawn = Math.max(2, Math.min(6, (minAliveTarget - currentEnemies) + paceCfg.burstBias));
    } else if (currentEnemies < minAliveTarget) {
        toSpawn = Math.min(4, Math.max(1, Math.ceil((minAliveTarget - currentEnemies) / 4)));
    } else if (deficit > 45 && Math.random() < 0.3) {
        toSpawn = 2;
    }

    toSpawn = Math.min(toSpawn, cfg.enemyCap - currentEnemies);
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
        enemy.life = generateRandom(cfg.enemyLifeMin, cfg.enemyLifeMax);
        elements.push(enemy);
        spawned++;
    }

    if (spawned > 0) {
        enemySpawnCooldown = emergencyMode
            ? generateRandom(0, 2)
            : (currentEnemies < minAliveTarget ? generateRandom(1, 3) : generateRandom(1, 4));
        enemySpawnCooldown = Math.max(0, enemySpawnCooldown + paceCfg.cooldownBias);
        noEnemySpawnTicks = 0;
        syncLevelsBoardState();
        return true;
    }

    return false;
}

function processEnergyNodesForLevels(elementsArg, boardArg) {
    let i = elementsArg.length;
    while (i--) {
        const e = elementsArg[i];
        if (e instanceof EnergyNode) {
            e.life--;
            if (e.life <= 0) elementsArg.splice(i, 1);
        }
    }

    const nodes = elementsArg.filter(e => e instanceof EnergyNode);
    if (nodes.length < 6 && Math.random() < 0.15) {
        const row = generateRandom(0, boardArg.rows);
        const col = generateRandom(0, boardArg.cols);
        if (MovUtils.isEmpty(elementsArg, row, col)) elementsArg.push(new EnergyNode(row, col));
    }
}

if (typeof EnergyManager !== 'undefined') {
    EnergyManager.processNodes = processEnergyNodesForLevels;
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

        if (renderer) renderer.spawnFlash(ent.col * renderer.cellSize, ent.row * renderer.cellSize, Colors.energy, 2);
        const gain = abilityCharges - prevCharges;
        showChargeFeedback(
            ent.row,
            ent.col,
            gain > 0
                ? `+${gain} CHARGE${gain > 1 ? 'S' : ''}`
                : 'MAX'
        );
        EventManager.emit({ type: 'fight', row: ent.row, col: ent.col, color: Colors.energy });
        syncLevelsBoardState();
        return true;
    }

    return false;
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

function showOverlayMessage(mainText, subText) {
    if (btnBegin) btnBegin.textContent = 'BEGIN CAMPAIGN';
    if (btnOverlayReset) btnOverlayReset.style.display = '';
    if (overlayMsg) overlayMsg.textContent = mainText;
    const overlaySub = document.getElementById('overlay-sub');
    if (overlaySub) overlaySub.textContent = subText;
    if (overlay) overlay.classList.remove('hidden');
}

function showLevelTransitionOverlay(nextLevelIndex) {
    const nextName = getLevelName(nextLevelIndex);
    if (btnBegin) btnBegin.textContent = `BEGIN ${nextName.toUpperCase()}`;
    if (btnOverlayReset) btnOverlayReset.style.display = 'none';
    if (overlayMsg) {
        overlayMsg.textContent = nextLevelIndex === 0
            ? `▶ LEVEL 1: ${nextName.toUpperCase()}`
            : `✅ LEVEL ${nextLevelIndex + 1} UNLOCKED`;
    }
    const overlaySub = document.getElementById('overlay-sub');
    if (overlaySub) {
        overlaySub.textContent = nextLevelIndex === 0
            ? `Stage: ${nextName}. Press BEGIN to start the campaign.`
            : `Next Stage: ${nextName}. Press BEGIN to continue.`;
    }
    if (overlay) overlay.classList.remove('hidden');
}

function checkLevelState() {
    const allyCtor = getAllyCtor();
    const allyCount = elements.filter(e => e instanceof allyCtor).length;
    if (allyCount <= 0) {
        stopGame();
        showOverlayMessage('❌ Campaign Failed', `You were eliminated on Level ${currentLevel + 1}.`);
        return;
    }

    const cfg = getLevelConfig();
    const progress = turn - levelTurnStart;
    if (progress < cfg.targetTurns) return;

    if (currentLevel >= LEVELS.length - 1) {
        stopGame();
        showOverlayMessage('🏆 Campaign Cleared', 'All level objectives completed.');
        return;
    }

    pendingLevelAdvance = true;
    pendingLevelIndex = currentLevel + 1;
    enemySpawnCooldown = 0;
    noEnemySpawnTicks = 0;
    if (!paused && typeof window.pauseGame === 'function') window.pauseGame();
    setHudStatus(`${getLevelName(pendingLevelIndex)} unlocked`, '#22d3ee', 1200);
    showLevelTransitionOverlay(pendingLevelIndex);
}

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
        if ((e instanceof Runner || e instanceof Chaser) && e.life <= 0) elements.splice(i, 1);
    }

    const clonesExpired = processTemporaryElectronClones();
    const erased = (elements.length < prevLen) || clonesExpired;

    if (logicRunning) {
        const spawned = spawnOpposingParticlesByLevel();
        if (!spawned) noEnemySpawnTicks++;
    }

    if (erased) idleMoves = 0;
    else idleMoves++;
    turn++;

    checkLevelState();

    board.placeElements(elements);
    renderer.updateLogicState(elements, board);
    if (typeof updateStats === 'function') updateStats();
    if (typeof window.__recordLogicFrame === 'function') {
        window.__recordLogicFrame(performance.now() - tickStartMs);
    }
    updateLevelHud();
};

function onCanvasMouseDown(e) {
    if (!canvas) return;
    if (typeof e.button === 'number' && e.button !== 0) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const point = e.touches && e.touches[0]
        ? e.touches[0]
        : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e);
    if (typeof point.clientX !== 'number' || typeof point.clientY !== 'number') return;

    const relX = point.clientX - rect.left;
    const relY = point.clientY - rect.top;
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return;

    const x = (relX / rect.width) * canvas.width;
    const y = (relY / rect.height) * canvas.height;

    if (board && renderer) {
        const cellWidth = rect.width / board.cols;
        const cellHeight = rect.height / board.rows;
        const clickedRow = Math.max(0, Math.min(board.rows - 1, Math.floor(relY / cellHeight)));
        const clickedCol = Math.max(0, Math.min(board.cols - 1, Math.floor(relX / cellWidth)));
        if (collectEnergyNode((ent) => ent.row === clickedRow && ent.col === clickedCol)) return;

        if (!logicRunning || paused) return;
        if (abilityCharges <= reserveCharges) {
            showChargeFeedback(clickedRow, clickedCol, 'NO CHARGE');
            setHudStatus(`Reserve lock: keep ${reserveCharges}`, '#f97316', 900);
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
        syncLevelsBoardState();
    }
}

if (canvas) canvas.addEventListener(canvasInputEvent, onCanvasMouseDown);

function disposeLevelsMode() {
    if (levelsDisposed) return;
    levelsDisposed = true;

    if (btnBegin) btnBegin.removeEventListener('click', restartCampaignFromOverlay);
    if (btnOverlayReset) btnOverlayReset.removeEventListener('click', restartCampaignFromOverlay);
    if (btnPauseControl) btnPauseControl.removeEventListener('click', onPauseCampaignClick);
    if (btnResetControl) btnResetControl.removeEventListener('click', restartCampaignFromOverlay);
    reserveDownBtn.removeEventListener('click', onReserveDownClick);
    reserveUpBtn.removeEventListener('click', onReserveUpClick);
    window.removeEventListener('keydown', onReserveHotkey);
    if (canvas) canvas.removeEventListener(canvasInputEvent, onCanvasMouseDown);

    if (hudStatusTimeoutId !== null) {
        clearTimeout(hudStatusTimeoutId);
        hudStatusTimeoutId = null;
    }

    if (abilityHud.parentNode) abilityHud.parentNode.removeChild(abilityHud);
    if (levelBadge.parentNode) levelBadge.parentNode.removeChild(levelBadge);

    if (typeof originalTick === 'function') window.tick = originalTick;
    if (typeof originalInit === 'function') window.initGame = originalInit;
    if (typeof originalStartGame === 'function') window.startGame = originalStartGame;
    if (typeof originalPauseGame === 'function') window.pauseGame = originalPauseGame;
    if (typeof originalStopGame === 'function') window.stopGame = originalStopGame;
    if (typeof originalResetGame === 'function') window.resetGame = originalResetGame;
    if (typeof originalShowWinner === 'function') window.showWinner = originalShowWinner;
}

window.addEventListener('pagehide', disposeLevelsMode, { once: true });
window.addEventListener('beforeunload', disposeLevelsMode, { once: true });

window.initGame = function() {
    currentLevel = 0;
    pendingLevelAdvance = false;
    pendingLevelIndex = -1;
    applyLevelDensityToInputs(getLevelConfig());
    if (typeof originalInit === 'function') originalInit();

    levelTurnStart = 0;
    enemySpawnCooldown = 0;
    noEnemySpawnTicks = 0;
    abilityCharges = MAX_ABILITY_CHARGES;

    setHudStatus('Level 1 initialized', '#38bdf8', 800);
    syncLevelsBoardState(true);

    pendingLevelAdvance = true;
    pendingLevelIndex = 0;
    if (logicRunning && typeof originalStopGame === 'function') originalStopGame();
    showLevelTransitionOverlay(0);
};

window.startGame = function() {
    if (typeof originalStartGame === 'function') originalStartGame();
    updateLevelHud();
};

window.pauseGame = function() {
    if (typeof originalPauseGame === 'function') originalPauseGame();
    updateLevelHud();
};

window.stopGame = function() {
    if (typeof originalStopGame === 'function') originalStopGame();
    updateLevelHud();
};

window.resetGame = function() {
    currentLevel = 0;
    pendingLevelAdvance = false;
    pendingLevelIndex = -1;
    applyLevelDensityToInputs(getLevelConfig());
    if (typeof originalResetGame === 'function') originalResetGame();
    else if (typeof originalInit === 'function') originalInit();

    levelTurnStart = 0;
    enemySpawnCooldown = 0;
    noEnemySpawnTicks = 0;
    abilityCharges = MAX_ABILITY_CHARGES;
    syncLevelsBoardState(true);
};

window.showWinner = function(runners, chasers) {
    if (typeof originalShowWinner === 'function') originalShowWinner(runners, chasers);
};

setTimeout(() => {
    if (!board) initGame();
}, 200);

})();
