/**
 * Particles – Synthetic Bundle
 * This file replaces the distributed main.js because the build system is unavailable.
 * It contains all the logic from the src/ directory compiled into a single file.
 */

// ── UTILITIES ────────────────────────────────────────────────────────────────

class Position {
	constructor(row = 0, col = 0) {
		this.row = row;
		this.col = col;
		this.dist = 0;
	}
	setDist(pos) {
		this.dist = Position.calcDistance(this, pos);
	}
	static calcDistance(p1, p2) {
		return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col);
	}
}

function generateRandom(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

class ListUtils {
	static isEmpty(gameElements, row, col) {
		return !gameElements.some(e => e.row === row && e.col === col);
	}
	static countCharacters(gameElements, character) {
		return gameElements.filter(e => {
			if (character === "Chaser") return e instanceof Chaser;
			if (character === "Runner") return e instanceof Runner;
			return false;
		}).length;
	}
}

class EventManager {
	static events = [];
	static emit(event) {
		this.events.push(event);
	}
	static consumeAll() {
		const evts = [...this.events];
		this.events.length = 0;
		return evts;
	}
}

// ── BOARD ELEMENTS ───────────────────────────────────────────────────────────

class BoardElement {
	constructor(row = 0, col = 0) {
		this._pos = new Position(row, col);
	}
	get pos() { return this._pos; }
	set pos(p) { this._pos = p; }
	get row() { return this._pos.row; }
	get col() { return this._pos.col; }
	setPos(row, col) {
		this._pos.row = row;
		this._pos.col = col;
	}
}

class Role extends BoardElement {
	constructor(row, col) {
		super(row, col);
		this._life = generateRandom(10, 20);
		this._speed = 1;
	}
	get life() { return this._life; }
	set life(v) { this._life = v; }
	get speed() { return this._speed; }
	set speed(v) { this._speed = v; }
	sumLife(amount) { this._life += amount; }
}

class Runner extends Role {
	constructor(row, col) {
		super(row, col);
		this._target = null;
		this._prevPos = new Position(row, col);
	}
	getTarget() { return this._target; }
	setTarget(elements) {
		let minDist = 5;
		let target = null;
		for (const e of elements) {
			if (e instanceof Chaser) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minDist) {
					minDist = dist;
					target = e;
				}
			}
		}
		this._target = target;
	}
	get prevPos() { return this._prevPos; }
	setPos(row, col) {
		this._prevPos = new Position(this.row, this.col);
		super.setPos(row, col);
	}
}

class Chaser extends Role {
	constructor(row, col) {
		super(row, col);
		this._speed = 1;
		this._speedTurns = 0;
		this._target = null;
		this._prevPos = new Position(row, col);
	}
	get chaserSpeed() { return this._speed; }
	set chaserSpeed(v) { this._speed = v; }
	get speedTurns() { return this._speedTurns; }
	set speedTurns(v) { this._speedTurns = v; }
	getTarget() { return this._target; }
	setTarget(elements) {
		let minDist = Number.MAX_SAFE_INTEGER;
		let target = null;
		for (const e of elements) {
			if (e instanceof Runner) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minDist) {
					minDist = dist;
					target = e;
				}
			}
		}
		this._target = target;
	}
	get prevPos() { return this._prevPos; }
	setPos(row, col) {
		this._prevPos = new Position(this.row, this.col);
		super.setPos(row, col);
	}
	decrementSpeedTurn() {
		if (this._speedTurns > 0) this._speedTurns--;
	}
}

class Obstacle extends BoardElement {
	constructor(row, col) {
		super(row, col);
	}
}

class Healer extends BoardElement {
	constructor(row, col, life) {
		super(row, col);
		this._extraLife = life;
	}
	get extraLife() { return this._extraLife; }
	set extraLife(v) { this._extraLife = v; }
}

class Speeder extends BoardElement {
	constructor(row, col) {
		super(row, col);
		this._speedValue = 2; // Named avoiding collision with speed property
	}
	get speed() { return this._speedValue; }
	set speed(v) { this._speedValue = v; }
}

// ── BOARD ────────────────────────────────────────────────────────────────────

class Board {
	constructor(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this._grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
	}
	getGrid() { return this._grid; }
	getCell(row, col) { return this._grid[row][col]; }
	setCell(row, col, value) { this._grid[row][col] = value; }
	clearBoard() {
		for (let i = 0; i < this.rows; i++)
			for (let j = 0; j < this.cols; j++)
				this._grid[i][j] = 0;
	}
	placeElements(elements) {
		this.clearBoard();
		for (const e of elements) {
			const name = e.constructor.name;
			const value =
				name === "Obstacle" ? 1 :
					name === "Runner" ? 2 :
						name === "Chaser" ? 3 :
							name === "Healer" ? 4 :
								name === "Speeder" ? 5 : 0;
			this.setCell(e.row, e.col, value);
		}
	}
}

// ── STRATEGIES & UTILS ────────────────────────────────────────────────────────

class MovUtils {
	static isEmpty(gameElements, row, col) {
		return !gameElements.some(e => e.row === row && e.col === col);
	}
	static isObstacle(gameElements, row, col) {
		return gameElements.some(e => e instanceof Obstacle && e.row === row && e.col === col);
	}
	static isWithinLimits(board, pos) {
		return pos.row >= 0 && pos.row < board.rows && pos.col >= 0 && pos.col < board.cols;
	}
	static isNeighbour(p1, p2) {
		return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col) === 1;
	}
	static isValid(gameElements, board, pos) {
		return this.isWithinLimits(board, pos) && !this.isObstacle(gameElements, pos.row, pos.col);
	}
	static generatePos(row, col) {
		return [
			new Position(row, col + 1),
			new Position(row, col - 1),
			new Position(row + 1, col),
			new Position(row - 1, col),
		];
	}
	static randomPos(pos) {
		const option = generateRandom(0, 4);
		let newRow = pos.row;
		let newCol = pos.col;
		switch (option) {
			case 0: newRow++; break;
			case 1: newRow--; break;
			case 2: newCol++; break;
			case 3: newCol--; break;
		}
		return new Position(newRow, newCol);
	}
}

class ChaserStrategy {
	static calcBestPos(elements, board, c) {
		let bestPos = null;
		let availPos = MovUtils.generatePos(c.row, c.col);
		const target = c.getTarget();
		if (target !== null) {
			for (const p of availPos) {
				if (MovUtils.isWithinLimits(board, p) && !MovUtils.isObstacle(elements, p.row, p.col))
					p.setDist(target.pos);
			}
			availPos = availPos.filter(p =>
				MovUtils.isWithinLimits(board, p) && !MovUtils.isObstacle(elements, p.row, p.col)
			);
			availPos.sort((p1, p2) => {
				const cmpDist = p1.dist - p2.dist;
				if (cmpDist !== 0) return cmpDist;
				const prev = c.prevPos;
				const p1Prev = prev && p1.row === prev.row && p1.col === prev.col;
				const p2Prev = prev && p2.row === prev.row && p2.col === prev.col;
				if (p1Prev && !p2Prev) return 1;
				if (!p1Prev && p2Prev) return -1;
				return generateRandom(-1, 2);
			});
			for (const p of availPos) {
				if (MovUtils.isEmpty(elements, p.row, p.col)) { bestPos = p; break; }
			}
			if (bestPos === null) bestPos = c.pos;
		} else {
			let candidate;
			do {
				candidate = MovUtils.randomPos(c.pos);
			} while (!MovUtils.isValid(elements, board, candidate) || !MovUtils.isEmpty(elements, candidate.row, candidate.col));
			bestPos = candidate;
		}
		return bestPos;
	}
}

class RunnerStrategy {
	static calcBestPos(elements, board, r) {
		let bestPos = null;
		let availPos = MovUtils.generatePos(r.row, r.col);
		const target = r.getTarget();
		if (target !== null) {
			for (const p of availPos) {
				if (MovUtils.isWithinLimits(board, p) && !MovUtils.isObstacle(elements, p.row, p.col))
					p.setDist(target.pos);
			}
			availPos = availPos.filter(p =>
				MovUtils.isWithinLimits(board, p) && !MovUtils.isObstacle(elements, p.row, p.col)
			);
			availPos.sort((p1, p2) => {
				const cmpDist = p2.dist - p1.dist;
				if (cmpDist !== 0) return cmpDist;
				const prev = r.prevPos;
				const p1Prev = prev && p1.row === prev.row && p1.col === prev.col;
				const p2Prev = prev && p2.row === prev.row && p2.col === prev.col;
				if (p1Prev && !p2Prev) return 1;
				if (!p1Prev && p2Prev) return -1;
				return generateRandom(-1, 2);
			});
			for (const p of availPos) {
				if (MovUtils.isEmpty(elements, p.row, p.col)) { bestPos = p; break; }
			}
			if (bestPos === null) bestPos = r.pos;
		} else {
			let candidate;
			do {
				candidate = MovUtils.randomPos(r.pos);
			} while (!MovUtils.isValid(elements, board, candidate) || !MovUtils.isEmpty(elements, candidate.row, candidate.col));
			bestPos = candidate;
		}
		return bestPos;
	}
}

class Movements {
	static move(elements, board) {
		for (const e of elements) {
			if (e instanceof Runner) {
				const best = RunnerStrategy.calcBestPos(elements, board, e);
				e.setPos(best.row, best.col);
			} else if (e instanceof Chaser) {
				const steps = e.speedTurns > 0 ? 2 : 1;
				for (let i = 0; i < steps; i++) {
					const best = ChaserStrategy.calcBestPos(elements, board, e);
					e.setPos(best.row, best.col);
					e.decrementSpeedTurn();
				}
			}
		}
	}
}

// ── GAME ACTIONS ─────────────────────────────────────────────────────────────

class Fight {
	static searchEnemies(elements) {
		for (const e of elements) {
			if (e instanceof Chaser) {
				const target = e.getTarget();
				if (target !== null && MovUtils.isNeighbour(e.pos, target.pos)) {
					Fight.fight(e, target);
				}
			}
		}
	}
	private static fight(c, r) {
		const cLife = c.life;
		const rLife = r.life;
		c.life = Math.max(0, cLife - rLife);
		r.life = Math.max(0, rLife - cLife);
		if (c.life <= 0) EventManager.emit({ type: "death", row: c.row, col: c.col, color: "#ef4444" });
		else EventManager.emit({ type: "fight", row: c.row, col: c.col, color: "#ef4444" });
		if (r.life <= 0) EventManager.emit({ type: "death", row: r.row, col: r.col, color: "#3b82f6" });
		else EventManager.emit({ type: "fight", row: r.row, col: r.col, color: "#3b82f6" });
	}
}

class Heal {
	static healRunners(elements) {
		for (const e of elements) {
			if (e instanceof Healer) {
				for (const other of elements) {
					if (other instanceof Runner && MovUtils.isNeighbour(e.pos, other.pos)) {
						other.sumLife(e.extraLife);
						e.extraLife = 0;
					}
				}
			}
		}
		let i = elements.length;
		while (i--) {
			const e = elements[i];
			if (e instanceof Healer && e.extraLife === 0) elements.splice(i, 1);
		}
	}
}

class Speed {
	static speedChasers(elements) {
		for (const e of elements) {
			if (e instanceof Speeder) {
				for (const other of elements) {
					if (other instanceof Chaser && MovUtils.isNeighbour(e.pos, other.pos)) {
						other.speedTurns = 5;
						e.speed = 0;
					}
				}
			}
		}
		let i = elements.length;
		while (i--) {
			const e = elements[i];
			if (e instanceof Speeder && e.speed === 0) elements.splice(i, 1);
		}
	}
}

class Game {
	static playGame(elements, board) {
		Movements.move(elements, board);
		Fight.searchEnemies(elements);
		Heal.healRunners(elements);
		Speed.speedChasers(elements);
	}
}

function spawnN(board, elements, count, fn) {
	for (let i = 0; i < count; i++) {
		let row, col;
		do {
			row = generateRandom(0, board.rows);
			col = generateRandom(0, board.cols);
		} while (!ListUtils.isEmpty(elements, row, col));
		elements.push(fn(row, col));
	}
}

class ElementsGenerator {
	static generateElements(board, counts, elements) {
		spawnN(board, elements, counts.obstacles, (r, c) => new Obstacle(r, c));
		spawnN(board, elements, counts.chasers, (r, c) => new Chaser(r, c));
		spawnN(board, elements, counts.runners, (r, c) => new Runner(r, c));
		spawnN(board, elements, counts.healers, (r, c) => new Healer(r, c, generateRandom(10, 50)));
		spawnN(board, elements, counts.speeders, (r, c) => new Speeder(r, c));
	}
}

// ── RENDERER ─────────────────────────────────────────────────────────────────

const C_BG = "#050d1a";
const C_RUNNER = "#3b82f6";
const C_CHASER = "#ef4444";
const C_HEALER = "#22c55e";
const C_SPEEDER = "#a855f7";

class Renderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.cellSize = 0;
		this.particles = [];
		this.board = null;
		this.elements = [];
		this.lastTime = 0;
		this.turnProgress = 1;
		this.turnDurationMs = 500;
	}
	resize(rows, cols) {
		const maxW = this.canvas.parentElement?.clientWidth ?? 800;
		const maxH = this.canvas.parentElement?.clientHeight ?? 600;
		this.cellSize = Math.max(4, Math.min(Math.floor(maxW / cols), Math.floor(maxH / rows)));
		this.canvas.width = cols * this.cellSize;
		this.canvas.height = rows * this.cellSize;
	}
	setTurnSpeed(ms) { this.turnDurationMs = ms; }
	updateLogicState(elements, board) {
		this.elements = elements;
		this.board = board;
		this.turnProgress = 0;
		const events = EventManager.consumeAll();
		for (const ev of events) {
			const cx = ev.col * this.cellSize + this.cellSize / 2;
			const cy = ev.row * this.cellSize + this.cellSize / 2;
			if (ev.type === "fight") this.spawnFlash(cx, cy, ev.color || "#fff", 2);
			if (ev.type === "death") {
				this.spawnFlash(cx, cy, "#ffffff", 6);
				this.spawnExplosion(cx, cy, ev.color || "#fff");
			}
		}
	}
	drawFrame(timeMs) {
		const dt = timeMs - this.lastTime;
		this.lastTime = timeMs;
		if (this.turnProgress < 1) {
			this.turnProgress += dt / this.turnDurationMs;
			if (this.turnProgress > 1) this.turnProgress = 1;
		}
		this.updateParticles(dt);
		this.renderAll();
	}
	private renderAll() {
		if (!this.board) return;
		const ctx = this.ctx;
		const cs = this.cellSize;
		ctx.fillStyle = C_BG;
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.fillStyle = "rgba(255,255,255,0.04)";
		for (let r = 0; r < this.board.rows; r++) {
			for (let c = 0; c < this.board.cols; c++) {
				const cx = c * cs + cs / 2;
				const cy = r * cs + cs / 2;
				ctx.beginPath();
				ctx.arc(cx, cy, 0.8, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		const ease = this.turnProgress;
		for (const e of this.elements) {
			let targetX = e.col * cs + cs / 2;
			let targetY = e.row * cs + cs / 2;
			let startX = targetX;
			let startY = targetY;
			if (e instanceof Role) {
				const prevPos = e.prevPos;
				if (prevPos) {
					startX = prevPos.col * cs + cs / 2;
					startY = prevPos.row * cs + cs / 2;
				}
			}
			const cx = startX + (targetX - startX) * ease;
			const cy = startY + (targetY - startY) * ease;
			const r = Math.max(2, cs * 0.28);
			if (e instanceof Obstacle) {
				const s = cs * 0.9;
				const rad = 4;
				const x = cx - s / 2;
				const y = cy - s / 2;
				ctx.fillStyle = "#12151f";
				ctx.beginPath();
				ctx.moveTo(x + rad, y);
				ctx.lineTo(x + s - rad, y);
				ctx.quadraticCurveTo(x + s, y, x + s, y + rad);
				ctx.lineTo(x + s, y + s - rad);
				ctx.quadraticCurveTo(x + s, y + s, x + s - rad, y + s);
				ctx.lineTo(x + rad, y + s);
				ctx.quadraticCurveTo(x, y + s, x, y + s - rad);
				ctx.lineTo(x, y + rad);
				ctx.quadraticCurveTo(x, y, x + rad, y);
				ctx.closePath();
				ctx.fill();
				continue;
			}
			if (startX !== targetX || startY !== targetY) {
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(cx, cy);
				ctx.strokeStyle = e instanceof Runner ? "rgba(59,130,246,0.2)" : "rgba(239,68,68,0.2)";
				ctx.lineWidth = r * 0.8;
				ctx.lineCap = "round";
				ctx.stroke();
			}
			if (e instanceof Runner) { this.drawElectron(ctx, cx, cy, r, C_RUNNER); continue; }
			if (e instanceof Chaser) { this.drawElectron(ctx, cx, cy, r, C_CHASER); continue; }
			if (e instanceof Healer) { this.drawElectron(ctx, cx, cy, r * 1.1, C_HEALER); continue; }
			if (e instanceof Speeder) { this.drawElectron(ctx, cx, cy, r * 1.1, C_SPEEDER); }
		}
		this.drawParticles(ctx);
	}
	spawnFlash(x, y, color, intensityMultiplier = 1) {
		for (let i = 0; i < 5 * intensityMultiplier; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 3 * intensityMultiplier + 1;
			this.particles.push({
				x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
				life: Math.random() * 200 + 100, maxLife: 300, color, size: Math.random() * 4 + 2
			});
		}
	}
	spawnExplosion(x, y, color) {
		for (let i = 0; i < 25; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 6 + 2;
			this.particles.push({
				x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
				life: Math.random() * 400 + 200, maxLife: 600, color, size: Math.random() * 3 + 1
			});
		}
	}
	updateParticles(dt) {
		let i = this.particles.length;
		while (i--) {
			const p = this.particles[i];
			p.life -= dt;
			if (p.life <= 0) { this.particles.splice(i, 1); continue; }
			p.x += p.vx * (dt / 16);
			p.y += p.vy * (dt / 16);
			p.vx *= 0.92; p.vy *= 0.92;
		}
	}
	drawParticles(ctx) {
		ctx.globalCompositeOperation = "lighter";
		for (const p of this.particles) {
			const alpha = Math.max(0, p.life / p.maxLife);
			ctx.globalAlpha = alpha;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1.0;
		ctx.globalCompositeOperation = "source-over";
	}
	drawElectron(ctx, cx, cy, r, color) {
		const pulse = Math.sin(performance.now() / 200) * 0.5 + 0.5;
		ctx.shadowBlur = 15 + pulse * 20;
		ctx.shadowColor = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;
		const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
		grad.addColorStop(0, "#ffffff");
		grad.addColorStop(0.4, color);
		grad.addColorStop(1, "rgba(0,0,0,0)");
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fillStyle = grad;
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
	}
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────

const canvas = document.getElementById("board-canvas");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnReset = document.getElementById("btn-reset");
const inpRows = document.getElementById("inp-rows");
const inpCols = document.getElementById("inp-cols");
const lblRows = document.getElementById("lbl-rows");
const lblCols = document.getElementById("lbl-cols");
const inpSpeed = document.getElementById("inp-speed");
const lblSpeed = document.getElementById("lbl-speed");
const inpRun = document.getElementById("inp-run");
const inpCha = document.getElementById("inp-cha");
const inpObs = document.getElementById("inp-obs");
const inpHea = document.getElementById("inp-hea");
const inpSpe = document.getElementById("inp-spe");
const lblRun = document.getElementById("lbl-run");
const lblCha = document.getElementById("lbl-cha");
const lblObs = document.getElementById("lbl-obs");
const lblHea = document.getElementById("lbl-hea");
const lblSpe = document.getElementById("lbl-spe");
const cntRunners = document.getElementById("cnt-runners");
const cntChasers = document.getElementById("cnt-chasers");
const cntTurn = document.getElementById("cnt-turn");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlay-msg");

const renderer = new Renderer(canvas);
let board;
let elements;
let logicIntervalId = null;
let animFrameId = null;
let paused = false;
let turn = 0;
let idleMoves = 0;

function getRows() { return parseInt(inpRows.value, 10); }
function getCols() { return parseInt(inpCols.value, 10); }
function getCounts() {
	return {
		runners: parseInt(inpRun.value, 10),
		chasers: parseInt(inpCha.value, 10),
		obstacles: parseInt(inpObs.value, 10),
		healers: parseInt(inpHea.value, 10),
		speeders: parseInt(inpSpe.value, 10)
	};
}
function getSpeedMs() { return Math.round(1000 / parseInt(inpSpeed.value, 10)); }

function initGame() {
	const rows = getRows();
	const cols = getCols();
	board = new Board(rows, cols);
	elements = [];
	ElementsGenerator.generateElements(board, getCounts(), elements);
	board.placeElements(elements);
	renderer.resize(rows, cols);
	turn = 0;
	idleMoves = 0;
	updateStats();
	renderer.setTurnSpeed(getSpeedMs());
	renderer.updateLogicState(elements, board);
	overlay.classList.add("hidden");
	if (animFrameId !== null) cancelAnimationFrame(animFrameId);
	animLoop(performance.now());
}

function tick() {
	if (paused) return;
	for (const e of elements) {
		if (e instanceof Chaser) e.setTarget(elements);
		if (e instanceof Runner) e.setTarget(elements);
	}
	Game.playGame(elements, board);
	const prevLen = elements.length;
	let i = elements.length;
	while (i--) {
		const e = elements[i];
		if ((e instanceof Runner || e instanceof Chaser) && e.life <= 0) elements.splice(i, 1);
	}
	const erased = elements.length < prevLen;
	const runners = ListUtils.countCharacters(elements, "Runner");
	const chasers = ListUtils.countCharacters(elements, "Chaser");
	board.placeElements(elements);
	renderer.updateLogicState(elements, board);
	if (erased) idleMoves = 0; else idleMoves++;
	turn++;
	updateStats();
	if (runners === 0 || chasers === 0 || idleMoves >= 50) {
		stopGame();
		showWinner(runners, chasers);
	}
}

function animLoop(time) {
	renderer.drawFrame(time);
	animFrameId = requestAnimationFrame(animLoop);
}

function startGame() {
	if (logicIntervalId !== null) return;
	paused = false;
	const ms = getSpeedMs();
	renderer.setTurnSpeed(ms);
	logicIntervalId = setInterval(tick, ms);
	btnStart.setAttribute("disabled", "");
	btnPause.removeAttribute("disabled");
}

function pauseGame() {
	paused = !paused;
	btnPause.textContent = paused ? "▶ Resume" : "⏸ Pause";
}

function stopGame() {
	if (logicIntervalId !== null) { clearInterval(logicIntervalId); logicIntervalId = null; }
	btnStart.removeAttribute("disabled");
	btnPause.setAttribute("disabled", "");
	btnPause.textContent = "⏸ Pause";
	paused = false;
}

function resetGame() { stopGame(); initGame(); }

function showWinner(runners, chasers) {
	let msg;
	if (runners === 0 && chasers === 0) msg = "⚡ It's a Tie!";
	else if (runners === 0) msg = "🔴 Electrons (Chasers) Win!";
	else if (chasers === 0) msg = "🔵 Photons (Runners) Win!";
	else msg = "⏱ Time's up! It's a Draw.";
	overlayMsg.textContent = msg;
	overlay.classList.remove("hidden");
}

function updateStats() {
	const runners = ListUtils.countCharacters(elements ?? [], "Runner");
	const chasers = ListUtils.countCharacters(elements ?? [], "Chaser");
	cntRunners.textContent = String(runners);
	cntChasers.textContent = String(chasers);
	cntTurn.textContent = String(turn);
}

// ── LISTENERS ────────────────────────────────────────────────────────────────

inpRows.addEventListener("input", () => { lblRows.textContent = inpRows.value; });
inpCols.addEventListener("input", () => { lblCols.textContent = inpCols.value; });
inpRun.addEventListener("input", () => { lblRun.textContent = inpRun.value; });
inpCha.addEventListener("input", () => { lblCha.textContent = inpCha.value; });
inpObs.addEventListener("input", () => { lblObs.textContent = inpObs.value; });
inpHea.addEventListener("input", () => { lblHea.textContent = inpHea.value; });
inpSpe.addEventListener("input", () => { lblSpe.textContent = inpSpe.value; });
inpSpeed.addEventListener("input", () => {
	lblSpeed.textContent = `${inpSpeed.value}x`;
	const ms = getSpeedMs();
	renderer.setTurnSpeed(ms);
	if (logicIntervalId !== null) { stopGame(); startGame(); }
});

btnStart.addEventListener("click", () => { if (!board) initGame(); startGame(); });
btnPause.addEventListener("click", pauseGame);
btnReset.addEventListener("click", resetGame);
document.getElementById("btn-overlay-reset").addEventListener("click", resetGame);

window.addEventListener("resize", () => {
	if (board) {
		renderer.resize(board.rows, board.cols);
		renderer.updateLogicState(elements, board);
	}
});

// Initialization
lblRows.textContent = inpRows.value;
lblCols.textContent = inpCols.value;
lblSpeed.textContent = `${inpSpeed.value}x`;
lblRun.textContent = inpRun.value;
lblCha.textContent = inpCha.value;
lblObs.textContent = inpObs.value;
lblHea.textContent = inpHea.value;
lblSpe.textContent = inpSpe.value;

initGame();
