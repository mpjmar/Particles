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
	static maxEvents = 1000;
	static emit(event) {
		this.events.push(event);
		if (this.events.length > this.maxEvents) {
			this.events.splice(0, this.events.length - this.maxEvents);
		}
	}
	static consumeAll() {
		const evts = [...this.events];
		this.events.length = 0;
		return evts;
	}
}

class DeformationWave {
	constructor(x, y, maxRadius) {
		this.x = x;
		this.y = y;
		this.maxRadius = maxRadius;
		this.r = 0;
		this.life = 1.0;
		this.speed = 10;
		this.amplitude = 7;
	}
	update(dt) {
		const step = (dt / 16) * this.speed;
		this.r += step;
		this.life -= dt / 800; // Decay faster (800ms)
		return this.life > 0;
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
		this._enemyTarget = null;
		this._energyTarget = null;
		this._prevPos = new Position(row, col);
		this._speedTurns = 0;
		this._overchargeTurns = 0;
		this._shieldLife = 0;
	}
	getTarget() { return this._energyTarget || this._enemyTarget; }
	isTargetingEnergy() { return this._energyTarget !== null; }
	setTarget(elements, chasers = null, energyNodes = null) {
		let minEnemyDist = 7;
		let minEnergyDist = 8;
		this._enemyTarget = null;
		this._energyTarget = null;
		const enemySource = chasers || elements;
		for (const e of enemySource) {
			if (e instanceof Chaser) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minEnemyDist) {
					minEnemyDist = dist;
					this._enemyTarget = e;
				}
			}
		}
		const energySource = energyNodes || elements;
		for (const e of energySource) {
			if (e instanceof EnergyNode) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minEnergyDist) {
					minEnergyDist = dist;
					this._energyTarget = e;
				}
			}
		}
	}
	get prevPos() { return this._prevPos; }
	get speedTurns() { return this._speedTurns; }
	set speedTurns(v) { this._speedTurns = Math.max(0, v); }
	get overchargeTurns() { return this._overchargeTurns; }
	set overchargeTurns(v) { this._overchargeTurns = Math.max(0, v); }
	get shieldLife() { return this._shieldLife; }
	set shieldLife(v) { this._shieldLife = Math.max(0, v); }
	setPos(row, col) {
		this._prevPos = new Position(this.row, this.col);
		super.setPos(row, col);
	}
	decrementSpeedTurn() {
		if (this._speedTurns > 0) this._speedTurns--;
	}
	decrementOverchargeTurn() {
		if (this._overchargeTurns > 0) this._overchargeTurns--;
	}
}

class Chaser extends Role {
	constructor(row, col) {
		super(row, col);
		this._speed = 1;
		this._speedTurns = 0;
		this._enemyTarget = null;
		this._energyTarget = null;
		this._prevPos = new Position(row, col);
	}
	get chaserSpeed() { return this._speed; }
	set chaserSpeed(v) { this._speed = v; }
	get speedTurns() { return this._speedTurns; }
	set speedTurns(v) { this._speedTurns = v; }
	getTarget() { return this._energyTarget || this._enemyTarget; }
	setTarget(elements, runners = null, energyNodes = null) {
		let minEnemyDist = 9;
		let minEnergyDist = 8;
		this._enemyTarget = null;
		this._energyTarget = null;
		const enemySource = runners || elements;
		for (const e of enemySource) {
			if (e instanceof Runner) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minEnemyDist) {
					minEnemyDist = dist;
					this._enemyTarget = e;
				}
			}
		}
		const energySource = energyNodes || elements;
		for (const e of energySource) {
			if (e instanceof EnergyNode) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minEnergyDist) {
					minEnergyDist = dist;
					this._energyTarget = e;
				}
			}
		}
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
		this._charges = generateRandom(3, 6);
		this._cooldown = 0;
	}
	get speed() { return this._speedValue; }
	set speed(v) { this._speedValue = v; }
	get charges() { return this._charges; }
	set charges(v) { this._charges = Math.max(0, v); }
	get cooldown() { return this._cooldown; }
	set cooldown(v) { this._cooldown = Math.max(0, v); }
}

class EnergyNode extends BoardElement {
	constructor(row, col, energyValue = generateRandom(1, 4)) {
		super(row, col);
		this.energyValue = energyValue;
		this.life = generateRandom(18, 36); // turns until it disappears
		this.maxLife = this.life;
	}
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
								name === "Speeder" ? 5 :
									name === "EnergyNode" ? 6 : 0;
			this.setCell(e.row, e.col, value);
		}
	}
}

// ── STRATEGIES & UTILS ────────────────────────────────────────────────────────

class MovUtils {
	static toKey(row, col) {
		return `${row},${col}`;
	}
	static buildOccupancy(gameElements) {
		const occupied = new Set();
		for (const e of gameElements) occupied.add(this.toKey(e.row, e.col));
		return occupied;
	}
	static isEmpty(gameElements, row, col) {
		return !gameElements.some(e => e.row === row && e.col === col);
	}
	static isEmptyFast(occupied, row, col) {
		return !occupied.has(this.toKey(row, col));
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
	static calcBestPos(elements, board, c, occupied = null) {
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
				return Math.random() - 0.5;
			});
			if (occupied) occupied.delete(MovUtils.toKey(c.row, c.col));
			for (const p of availPos) {
				if (occupied ? MovUtils.isEmptyFast(occupied, p.row, p.col) : MovUtils.isEmpty(elements, p.row, p.col)) {
					bestPos = p;
					break;
				}
			}
			if (occupied) occupied.add(MovUtils.toKey(c.row, c.col));
			if (bestPos === null) bestPos = c.pos;
		} else {
			let candidate;
			do {
				candidate = MovUtils.randomPos(c.pos);
			} while (!MovUtils.isValid(elements, board, candidate) || !(occupied ? MovUtils.isEmptyFast(occupied, candidate.row, candidate.col) : MovUtils.isEmpty(elements, candidate.row, candidate.col)));
			bestPos = candidate;
		}
		return bestPos;
	}
}

class RunnerStrategy {
	static calcBestPos(elements, board, r, occupied = null) {
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
				const sign = r.isTargetingEnergy() ? 1 : -1;
				const cmpDist = (p1.dist - p2.dist) * sign;
				if (cmpDist !== 0) return cmpDist;
				const prev = r.prevPos;
				const p1Prev = prev && p1.row === prev.row && p1.col === prev.col;
				const p2Prev = prev && p2.row === prev.row && p2.col === prev.col;
				if (p1Prev && !p2Prev) return 1;
				if (!p1Prev && p2Prev) return -1;
				return Math.random() - 0.5;
			});
			if (occupied) occupied.delete(MovUtils.toKey(r.row, r.col));
			for (const p of availPos) {
				if (occupied ? MovUtils.isEmptyFast(occupied, p.row, p.col) : MovUtils.isEmpty(elements, p.row, p.col)) {
					bestPos = p;
					break;
				}
			}
			if (occupied) occupied.add(MovUtils.toKey(r.row, r.col));
			if (bestPos === null) bestPos = r.pos;
		} else {
			let candidate;
			do {
				candidate = MovUtils.randomPos(r.pos);
			} while (!MovUtils.isValid(elements, board, candidate) || !(occupied ? MovUtils.isEmptyFast(occupied, candidate.row, candidate.col) : MovUtils.isEmpty(elements, candidate.row, candidate.col)));
			bestPos = candidate;
		}
		return bestPos;
	}
}

class Movements {
	static move(elements, board) {
		const occupied = MovUtils.buildOccupancy(elements);
		for (const e of elements) {
			if (e instanceof Runner) {
				const steps = e.speedTurns > 0 ? 2 : 1;
				for (let i = 0; i < steps; i++) {
					const oldKey = MovUtils.toKey(e.row, e.col);
					const best = RunnerStrategy.calcBestPos(elements, board, e, occupied);
					e.setPos(best.row, best.col);
					occupied.delete(oldKey);
					occupied.add(MovUtils.toKey(e.row, e.col));
					e.decrementSpeedTurn();
				}
				e.decrementOverchargeTurn();
			} else if (e instanceof Chaser) {
				const steps = e.speedTurns > 0 ? 2 : 1;
				for (let i = 0; i < steps; i++) {
					const oldKey = MovUtils.toKey(e.row, e.col);
					const best = ChaserStrategy.calcBestPos(elements, board, e, occupied);
					e.setPos(best.row, best.col);
					occupied.delete(oldKey);
					occupied.add(MovUtils.toKey(e.row, e.col));
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
	static fight(c, r) {
		const cLife = c.life;
		const rLife = r.life;

		const runnerDamage = r.overchargeTurns > 0
			? Math.max(1, Math.round(rLife * 1.3))
			: rLife;

		c.life = Math.max(0, cLife - runnerDamage);

		let incomingToRunner = cLife;
		if (r.shieldLife > 0) {
			const absorbed = Math.min(r.shieldLife, incomingToRunner);
			r.shieldLife -= absorbed;
			incomingToRunner -= absorbed;
			EventManager.emit({ type: "fight", row: r.row, col: r.col, color: Colors.runner });
		}

		r.life = Math.max(0, rLife - incomingToRunner);
		if (c.life <= 0) EventManager.emit({ type: "death", row: c.row, col: c.col, color: Colors.chaser });
		else EventManager.emit({ type: "fight", row: c.row, col: c.col, color: Colors.chaser });
		if (r.life <= 0) EventManager.emit({ type: "death", row: r.row, col: r.col, color: Colors.runner });
		else EventManager.emit({ type: "fight", row: r.row, col: r.col, color: Colors.runner });
	}
}

class Heal {
	static healRunners(elements) {
		for (const e of elements) {
			if (e instanceof Healer) {
				if (e.extraLife <= 0) continue;

				const nearbyRunners = elements.filter(other =>
					other instanceof Runner &&
					Position.calcDistance(e.pos, other.pos) <= 2
				);

				if (nearbyRunners.length === 0) {
					// Passive decay to avoid immortal healers when no photons are nearby.
					e.extraLife = Math.max(0, e.extraLife - 1);
					continue;
				}

				nearbyRunners.sort((a, b) => a.life - b.life);
				const healTargets = nearbyRunners.slice(0, 2);
				const baseHeal = Math.max(4, Math.min(12, Math.floor(e.extraLife / 3)));

				for (const target of healTargets) {
					if (e.extraLife <= 0) break;
					const healAmount = Math.min(baseHeal, e.extraLife);
					target.sumLife(healAmount);
					target.overchargeTurns = Math.max(target.overchargeTurns, 10);
					target.shieldLife = Math.min(140, target.shieldLife + Math.max(3, Math.round(healAmount * 0.9)));
					e.extraLife -= healAmount;
					EventManager.emit({ type: "fight", row: target.row, col: target.col, color: Colors.healer });
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
				if (e.charges <= 0) continue;
				if (e.cooldown > 0) {
					e.cooldown--;
					continue;
				}

				const nearbyAllies = elements.filter(other =>
					other instanceof Chaser &&
					Position.calcDistance(e.pos, other.pos) <= 2
				);

				if (nearbyAllies.length === 0) continue;

				nearbyAllies.sort((a, b) => Position.calcDistance(e.pos, a.pos) - Position.calcDistance(e.pos, b.pos));
				const boostTargets = nearbyAllies.slice(0, 2);

				for (const target of boostTargets) {
					target.speedTurns = Math.max(target.speedTurns, 10);
					EventManager.emit({ type: "fight", row: target.row, col: target.col, color: Colors.speeder });
				}

				e.charges -= 1;
				e.cooldown = 2;
			}
		}
		let i = elements.length;
		while (i--) {
			const e = elements[i];
			if (e instanceof Speeder && e.charges <= 0) elements.splice(i, 1);
		}
	}
}

class EnergyManager {
	static processNodes(elements, board) {
		const actors = [];
		const nodes = [];

		// 1. Decay node life and collect active actors/nodes in one sweep
		let i = elements.length;
		while (i--) {
			const e = elements[i];
			if (e instanceof EnergyNode) {
				e.life--;
				if (e.life <= 0) {
					elements.splice(i, 1);
					continue;
				}
				nodes.push(e);
				continue;
			}
			if (e instanceof Runner || e instanceof Chaser) actors.push(e);
		}

		// 2. Consume nodes if a Runner or Chaser is nearby
		let consumedNodes = 0;
		for (const node of nodes) {
			let consumed = false;
			for (const actor of actors) {
				if (actor.row === node.row && actor.col === node.col || MovUtils.isNeighbour(node.pos, actor.pos)) {
					const value = Math.max(1, node.energyValue || 1);

					if (actor instanceof Runner) actor.sumLife(generateRandom(10, 20) * value);
					if (actor instanceof Chaser) actor.speedTurns += (value + 2);

					EventManager.emit({ type: "fight", row: node.row, col: node.col, color: Colors.energy });
					const idx = elements.indexOf(node);
					if (idx !== -1) {
						elements.splice(idx, 1);
						consumedNodes++;
					}
					consumed = true;
					break;
				}
			}
			if (consumed) continue;
		}

		// 3. Random spawn
		const remainingNodes = nodes.length - consumedNodes;
		if (remainingNodes < 6 && Math.random() < 0.15) {
			let row = generateRandom(0, board.rows);
			let col = generateRandom(0, board.cols);
			if (MovUtils.isEmpty(elements, row, col)) {
				elements.push(new EnergyNode(row, col));
			}
		}
	}
}

class Game {
	static playGame(elements, board) {
		Movements.move(elements, board);
		Fight.searchEnemies(elements);
		Heal.healRunners(elements);
		Speed.speedChasers(elements);
		EnergyManager.processNodes(elements, board);
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

// ── COLORS ───────────────────────────────────────────────────────────────────

const Colors = {
	bg: "#050d1a",
	runner: "#3b82f6",
	chaser: "#ef4444",
	healer: "#22c55e",
	speeder: "#ff2a2a",
	obstacle: "#9da0a6",
	accent: "#0ea5e9",
	energy: "#d946ef", // bright fuchsia/purple for energy nodes
	text: "#e2e8f0"
};

function updateColorsFromCSS() {
	const style = getComputedStyle(document.documentElement);
	const get = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
	Colors.bg = get('--bg', Colors.bg);
	Colors.runner = get('--runner', Colors.runner);
	Colors.chaser = get('--chaser', Colors.chaser);
	Colors.healer = get('--healer', Colors.healer);
	Colors.speeder = get('--speeder', Colors.speeder);
	Colors.obstacle = get('--obstacle', Colors.obstacle);
	Colors.accent = get('--accent', Colors.accent);
	Colors.energy = get('--energy', Colors.energy);
	Colors.text = get('--text', Colors.text);
	console.log("Colors updated from CSS:", Colors);
}

function colorWithAlpha(color, alpha) {
	if (!color) return `rgba(255,255,255,${alpha})`;
	if (color.startsWith('rgb')) {
		if (color.startsWith('rgba')) {
			return color.replace(/[\d\.]+\)$/g, `${alpha})`);
		}
		return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
	}
	if (color.startsWith('#')) {
		let r = 0, g = 0, b = 0;
		if (color.length === 4) {
			r = parseInt(color[1] + color[1], 16);
			g = parseInt(color[2] + color[2], 16);
			b = parseInt(color[3] + color[3], 16);
		} else if (color.length === 7) {
			r = parseInt(color.substring(1, 3), 16);
			g = parseInt(color.substring(3, 5), 16);
			b = parseInt(color.substring(5, 7), 16);
		}
		return `rgba(${r},${g},${b},${alpha})`;
	}
	return color;
}

// ── TRAIL SYSTEM REMOVED ─────────────────────────────────────────────────────

// ── PERLIN NOISE ─────────────────────────────────────────────────────────────
// Classic 2D Perlin gradient noise + fBm for organic nebula backgrounds
class PerlinNoise {
	constructor(seed = 0) {
		const p = new Uint8Array(256);
		for (let i = 0; i < 256; i++) p[i] = i;
		let s = (seed | 0) || 42;
		for (let i = 255; i > 0; i--) {
			s = (Math.imul(s, 1664525) + 1013904223) | 0;
			const j = (s >>> 0) % (i + 1);
			[p[i], p[j]] = [p[j], p[i]];
		}
		this.perm = new Uint8Array(512);
		for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
	}
	_fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
	_lerp(a, b, t) { return a + t * (b - a); }
	_grad(h, x, y) {
		const g = h & 3;
		const u = g < 2 ? x : y, v = g < 2 ? y : x;
		return ((g & 1) ? -u : u) + ((g & 2) ? -v : v);
	}
	noise(x, y) {
		const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
		x -= Math.floor(x); y -= Math.floor(y);
		const u = this._fade(x), v = this._fade(y);
		const a = this.perm[X] + Y, b = this.perm[X + 1] + Y;
		return this._lerp(
			this._lerp(this._grad(this.perm[a], x, y), this._grad(this.perm[b], x - 1, y), u),
			this._lerp(this._grad(this.perm[a + 1], x, y - 1), this._grad(this.perm[b + 1], x - 1, y - 1), u),
			v
		) * 0.5 + 0.5;
	}
	fbm(x, y, octaves = 4) {
		let val = 0, amp = 1, freq = 1, max = 0;
		for (let i = 0; i < octaves; i++) {
			val += this.noise(x * freq, y * freq) * amp;
			max += amp; amp *= 0.5; freq *= 2;
		}
		return val / max;
	}
}

class Renderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.cellSize = 0;
		this.particles = [];
		this.energyRings = [];   // shockwave rings for interactions
		this.board = null;
		this.elements = [];
		this.lastTime = 0;
		this.turnProgress = 1;
		this.turnDurationMs = 500;
		// Nebula field – generated once, repainted every frame
		this._nebulaSeed = Math.floor(Math.random() * 99999);
		this._starField = null;
		// Perlin noise engine
		this._perlin = new PerlinNoise(this._nebulaSeed);
		// Offscreen canvas for the low-res noise texture
		this._noiseCanvas = document.createElement('canvas');
		this._noiseCtx = this._noiseCanvas.getContext('2d');
		// Only update the noise every N frames for performance
		this._noiseFrame = 0;
		this.isMousePresent = false;

		this.deformationWaves = [];
		// Screen shake state
		this.shake = 0;
		this._mouseEventsAttached = false;
		this.fxQuality = 'high';
		this.renderProfile = 'balanced';
		this.drawNetwork = true;
		this.fxMultiplier = 1;
		this.maxParticles = 250;
		this.fps = 0;
		this._fpsAccumMs = 0;
		this._fpsFrames = 0;
	}

	_refreshFxBudget() {
		const baseMultiplier = this.fxQuality === 'low' ? 0.45 : 1;
		const baseMaxParticles = this.fxQuality === 'low' ? 130 : 250;
		const profileFactor = this.renderProfile === 'performance' ? 0.72 : 1;
		this.fxMultiplier = baseMultiplier * profileFactor;
		this.maxParticles = Math.max(90, Math.round(baseMaxParticles * profileFactor));
	}

	setFxQuality(mode) {
		this.fxQuality = mode === 'low' ? 'low' : 'high';
		this._refreshFxBudget();
	}

	setRenderProfile(mode) {
		this.renderProfile = mode === 'performance' ? 'performance' : 'balanced';
		this.drawNetwork = this.renderProfile !== 'performance';
		this._refreshFxBudget();
	}

	attachMouseEvents() {
		if (this._mouseEventsAttached) return;
		this._mouseEventsAttached = true;

		this.canvas.addEventListener('mousemove', (e) => {
			const rect = this.canvas.getBoundingClientRect();
			this.mouseX = e.clientX - rect.left;
			this.mouseY = e.clientY - rect.top;
			this.isMousePresent = true;
		});
		this.canvas.addEventListener('click', (e) => {
			const rect = this.canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			this._spawnRipple(x, y);
			// Subtle space deformation on click (capped)
			if (this.deformationWaves.length < 2) {
				const clickWave = new DeformationWave(x, y, Math.max(this.canvas.width, this.canvas.height) * 0.9);
				clickWave.amplitude = 5;
				clickWave.speed = 9;
				this.deformationWaves.push(clickWave);
			}
		});
		this.canvas.addEventListener('mouseleave', () => {
			this.isMousePresent = false;
		});
	}

	resize(rows, cols) {
		const maxW = this.canvas.parentElement?.clientWidth ?? 800;
		const parentH = this.canvas.parentElement?.clientHeight ?? 600;
		const topBar = document.querySelector(".top-bar");
		const reservedTopSpace = topBar ? (topBar.offsetHeight + 16) : 0;
		const maxH = Math.max(120, parentH - reservedTopSpace);
		this.cellSize = Math.max(4, Math.min(Math.floor(maxW / cols), Math.floor(maxH / rows)));
		this.canvas.width = cols * this.cellSize;
		this.canvas.height = rows * this.cellSize;
		this._buildBokeh(rows, cols);
		this._buildNoiseBackground(); // Generate once, never recompute
	}

	_buildBokeh(rows, cols) {
		// Bokeh circles — 3 layers of depth for digital tech background
		const bokeh = [];
		const count = Math.floor(rows * cols * 0.015);
		for (let i = 0; i < count; i++) {
			const type = Math.random();
			let r, speed, alphaMod;
			if (type < 0.2) { // Layer 1: Large, slow, background auroras
				r = Math.random() * 25 + 15; speed = Math.random() * 0.1 + 0.02; alphaMod = 0.5;
			} else if (type < 0.6) { // Layer 2: Medium glowing orbs
				r = Math.random() * 10 + 5; speed = Math.random() * 0.2 + 0.05; alphaMod = 0.8;
			} else { // Layer 3: Small, sharp foreground tech sparks
				r = Math.random() * 3 + 1; speed = Math.random() * 0.4 + 0.1; alphaMod = 1.2;
			}
			bokeh.push({
				x: Math.random() * cols * this.cellSize,
				y: Math.random() * rows * this.cellSize,
				r, speed, alphaMod,
				phase: Math.random() * Math.PI * 2,
				color: Math.random() < 0.25 ? "rgba(0, 229, 255," : "rgba(100, 180, 255," // Cyan vs Ice Blue
			});
		}
		this._starField = bokeh; // reuse same field name
	}

	setTurnSpeed(ms) { this.turnDurationMs = ms; }

	updateLogicState(elements, board) {
		const cs = this.cellSize;
		this.elements = elements;
		this.board = board;
		this.turnProgress = 0;
		const events = EventManager.consumeAll();
		for (const ev of events) {
			const cx = ev.col * cs + cs / 2;
			const cy = ev.row * cs + cs / 2;
			if (ev.type === "fight") {
				this._spawnAbsorptionWave(cx, cy, ev.color || Colors.accent);
				this.spawnFlash(cx, cy, ev.color || Colors.accent, 3);
			}
			if (ev.type === "death") {
				this._spawnDeathNova(cx, cy, ev.color || Colors.accent);
				// Local wave on death, capped to 2 waves total
				if (this.deformationWaves.length < 2) {
					const deathWave = new DeformationWave(cx, cy, 300);
					deathWave.amplitude = 15;
					this.deformationWaves.push(deathWave);
				}
			}
		}
	}

	drawFrame(timeMs, ms) {
		const dt = Math.min(32, timeMs - this.lastTime);
		this.lastTime = timeMs;
		this._fpsAccumMs += dt;
		this._fpsFrames++;
		if (this._fpsAccumMs >= 300) {
			this.fps = Math.round((this._fpsFrames * 1000) / this._fpsAccumMs);
			this._fpsAccumMs = 0;
			this._fpsFrames = 0;
		}

		this._updateDeformationWaves(dt);

		// Calculate turn evolution strictly from time delta, decouple from ticks logic
		if (this.logicTimer && ms > 0) {
			this.turnProgress = (timeMs - this.logicTimer) / ms;
			if (this.turnProgress > 1) this.turnProgress = 1;
			if (this.turnProgress < 0) this.turnProgress = 0;
		}

		this.updateParticles(dt);
		this._updateEnergyRings(dt);
		this.renderAll();
	}

	// ── MAIN RENDER ───────────────────────────────────────────────────────────
	renderAll() {
		const ctx = this.ctx;
		const cs = this.cellSize;

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		ctx.save();

		// Layer 1 – deep space background with bokeh
		this._drawDeepSpace(ctx);

		// Layer 3.5 - Network connections between particles
		if (this.drawNetwork && this.fxQuality !== 'low') this._drawNetworkConnections(ctx, cs);

		// Layer 4 – energy rings (interaction shockwaves)
		this._drawEnergyRings(ctx);

		// Layer 5 – elements
			const ease = this._easeInOut(this.turnProgress);
		for (const e of this.elements) {
			let targetX = e.col * cs + cs / 2;
			let targetY = e.row * cs + cs / 2;
			let startX = targetX;
			let startY = targetY;
			if (e instanceof Role && e.prevPos) {
				startX = e.prevPos.col * cs + cs / 2;
				startY = e.prevPos.row * cs + cs / 2;
			}
				const speedBoosted = e instanceof Chaser && e.speedTurns > 0;
				const moveEase = speedBoosted ? Math.min(1, Math.pow(ease, 0.62)) : ease;
				let cx = startX + (targetX - startX) * moveEase;
				let cy = startY + (targetY - startY) * moveEase;

			// Apply Lattice Deformation
			const def = this.getDeformationAt(cx, cy);
			cx += def.dx;
			cy += def.dy;

			// Apply soft magnetic pull from cursor
			if (this.isMousePresent) {
				const dx = this.mouseX - cx;
				const dy = this.mouseY - cy;
				const dist = Math.hypot(dx, dy);
				const pullRange = cs * 6; // Magnetic field radius
				if (dist < pullRange && dist > 1) {
					// Pull strength curve: stronger near middle, zero at exact center and edge
					const pull = Math.pow(1 - dist / pullRange, 1.5) * cs * 0.35;
					cx += (dx / dist) * pull;
					cy += (dy / dist) * pull;
				}
			}

			const r = Math.max(3, cs * 0.34);

				if (e instanceof Obstacle) { this._drawObstacle(ctx, cx, cy, cs); continue; }
				if (e instanceof Runner) { this._drawPhoton(ctx, cx, cy, r, Colors.runner, e); continue; }
				if (e instanceof Chaser) {
					if (speedBoosted) this._drawBoostedElectronTrail(ctx, startX, startY, cx, cy, cs);
					this._drawElectron(ctx, cx, cy, r, Colors.chaser);
					if (speedBoosted) this._drawBoostedElectronGhosts(ctx, startX, startY, cx, cy, cs);
					continue;
				}
			if (e instanceof Healer) { this._drawHealer(ctx, cx, cy, r, Colors.healer); continue; }
			if (e instanceof Speeder) { this._drawSpeeder(ctx, cx, cy, r, Colors.speeder); continue; }
			if (e instanceof EnergyNode) { this._drawEnergyNode(ctx, cx, cy, r, Colors.energy, e.life / e.maxLife); }
		}

		// Layer 6 – particle sparks (top)
		this.drawParticles(ctx);
	}

	// ── EASING ────────────────────────────────────────────────────────────────
	_easeInOut(t) {
		// Linear interpolation: essential for constant velocity between tile transitions
		// Any non-linear easing will cause a perceived "pause" or hitch at boundary points.
		return t;
	}

	_updateDeformationWaves(dt) {
		let i = this.deformationWaves.length;
		while (i--) {
			if (!this.deformationWaves[i].update(dt)) {
				this.deformationWaves.splice(i, 1);
			}
		}
	}

	getDeformationAt(x, y) {
		let dx = 0, dy = 0;
		for (const wave of this.deformationWaves) {
			const dist = Math.hypot(x - wave.x, y - wave.y);
			// Smaller, more localized ripple width
			const rippleWidth = 120;
			const delta = dist - wave.r;

			if (Math.abs(delta) < rippleWidth) {
				// Sine wave shaped deformation
				const strength = (1 - Math.abs(delta) / rippleWidth) * wave.life;
				const angle = Math.atan2(y - wave.y, x - wave.x);
				const push = Math.sin((delta / rippleWidth) * Math.PI) * wave.amplitude * strength;
				dx += Math.cos(angle) * push;
				dy += Math.sin(angle) * push;
			}
		}
		return { dx, dy };
	}

	// ── STATIC PERLIN NOISE BACKGROUND ─────────────────────────────────────────────
	// Built once when the board is resized. No per-frame computation.
	_buildNoiseBackground() {
		const W = this.canvas.width, H = this.canvas.height;
		const SCALE = 8; // 1/8 resolution
		const nw = Math.ceil(W / SCALE), nh = Math.ceil(H / SCALE);
		this._noiseCanvas.width = nw;
		this._noiseCanvas.height = nh;

		const nc = this._noiseCtx;
		const img = nc.createImageData(nw, nh);
		const data = img.data;

		const palette = [
			[0, 1, 5],  // near-black base
			[0, 5, 18],  // very dark navy
			[0, 18, 48],  // deep midnight blue
			[0, 38, 72],  // dark teal highlight (barely visible)
		];
		const lerpPal = (v) => {
			const idx = Math.min(palette.length - 2, Math.floor(v * (palette.length - 1)));
			const t = v * (palette.length - 1) - idx;
			const a = palette[idx], b = palette[idx + 1];
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
		};

		const p = this._perlin;
		for (let y = 0; y < nh; y++) {
			for (let x = 0; x < nw; x++) {
				const nx = x / nw * 3;
				const ny = y / nh * 3;
				// Lightweight domain warp (2 octaves)
				const warpX = p.fbm(nx + 1.7, ny + 9.2, 2);
				const warpY = p.fbm(nx + 8.3, ny + 2.8, 2);
				// 3-octave fBm, gamma 1.6 to keep midtones dark
				const val = Math.pow(p.fbm(nx + warpX * 0.6, ny + warpY * 0.6, 3), 1.6);
				const [r, g, b] = lerpPal(Math.min(1, val));
				const i = (y * nw + x) * 4;
				data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
			}
		}
		nc.putImageData(img, 0, 0);
	}

	// ── DRAW BACKGROUND + BOKEH ───────────────────────────────────────────────
	_drawDeepSpace(ctx) {
		const W = this.canvas.width, H = this.canvas.height;
		ctx.save();
		// Blit the pre-built noise texture (zero CPU cost)
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		if (this._noiseCanvas.width > 0) {
			ctx.drawImage(this._noiseCanvas, 0, 0, W, H);
		}

		// Overlay subtle bokeh for extra depth on top of the noise
		if (this._starField) {
			const now = performance.now() / 1000;
			ctx.globalCompositeOperation = "lighter";
			for (const b of this._starField) {
				const a = (0.04 + 0.07 * (0.5 + 0.5 * Math.sin(now * b.speed + b.phase))) * b.alphaMod;
				const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
				g.addColorStop(0, b.color + a + ")");
				g.addColorStop(1, "rgba(0,0,0,0)");
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		ctx.restore();
	}

	// ── LIGHTNING HELPER (Removed) ────────────────────────────────────────────

	// ── DIGITAL NETWORK CONNECTIONS ───────────────────────────────────────────
	_drawNetworkConnections(ctx, cs) {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		const runners = this.elements.filter(e => e instanceof Runner);
		const chasers = this.elements.filter(e => e instanceof Chaser);
		const ease = this._easeInOut(this.turnProgress);

		// Draw Cyan Network for Runners
		this._drawNetLinks(ctx, runners, cs, ease, cs * 5.0, "0, 229, 255");

		// Draw Red/Orange Neuronal Network for Chasers
		this._drawNetLinks(ctx, chasers, cs, ease, cs * 6.5, "255, 100, 40");

		// Also draw connections for temporary spawn nodes (cyan)
		const nodes = this.particles.filter(p => p.isNetworkNode);
		const maxNodeLinks = this.fxQuality === 'low' ? 80 : 180;
		let drawnNodeLinks = 0;
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const n1 = nodes[i];
				const n2 = nodes[j];
				const d = Math.hypot(n2.x - n1.x, n2.y - n1.y);
				const nodeMaxDist = cs * 5.25;
				if (d < nodeMaxDist) {
					const alpha = Math.pow(1 - d / nodeMaxDist, 2) * 0.6 * (n1.life / n1.maxLife) * (n2.life / n2.maxLife);
					ctx.beginPath();
					ctx.moveTo(n1.x, n1.y);
					ctx.lineTo(n2.x, n2.y);
					ctx.strokeStyle = `rgba(0, 229, 255, ${alpha.toFixed(3)})`;
					ctx.lineWidth = cs * 0.02;
					ctx.shadowBlur = cs * 0.2;
					ctx.shadowColor = `rgba(0, 229, 255, ${alpha.toFixed(3)})`;
					ctx.stroke();
					drawnNodeLinks++;
					if (drawnNodeLinks >= maxNodeLinks) break;
				}
			}
			if (drawnNodeLinks >= maxNodeLinks) break;
		}

		ctx.restore();
	}

	_drawNetLinks(ctx, arr, cs, ease, maxDist, rgbStr) {
		if (!arr || arr.length < 2) return;

		const points = arr.map((p) => {
			let x = (p.prevPos ? p.prevPos.col : p.col) * cs + cs / 2;
			let y = (p.prevPos ? p.prevPos.row : p.row) * cs + cs / 2;
			x += ((p.col * cs + cs / 2) - x) * ease;
			y += ((p.row * cs + cs / 2) - y) * ease;
			return { x, y };
		});

		points.sort((a, b) => a.x - b.x);

		const maxDistSq = maxDist * maxDist;
		const maxLinks = this.fxQuality === 'low' ? 140 : 320;
		let drawnLinks = 0;

		for (let i = 0; i < points.length; i++) {
			const p1 = points[i];
			for (let j = i + 1; j < points.length; j++) {
				const p2 = points[j];
				const dx = p2.x - p1.x;
				if (dx > maxDist) break;

				const dy = p2.y - p1.y;
				const dSq = dx * dx + dy * dy;
				if (dSq < maxDistSq) {
					const d = Math.sqrt(dSq);
					// More subtle alpha so network doesn't compete with particles
					const alpha = Math.pow(1 - d / maxDist, 1.2) * 0.40;
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.strokeStyle = `rgba(${rgbStr}, ${alpha.toFixed(3)})`;
					ctx.lineWidth = cs * 0.04;
					ctx.shadowBlur = cs * 0.2;
					ctx.shadowColor = `rgba(${rgbStr}, ${(alpha * 1.2).toFixed(3)})`;
					ctx.stroke();
					drawnLinks++;
					if (drawnLinks >= maxLinks) return;
				}
			}
		}
	}

	// ── PHOTON (Runner) — pure intense neon cyan orb ──────────────────────────
	// Visual inspiration: glowing nodes in the reference network images
	_drawPhoton(ctx, cx, cy, r, _color, runnerState = null) {
		const T = performance.now();
		const boosted = !!(runnerState && runnerState.overchargeTurns > 0);
		const shielded = !!(runnerState && runnerState.shieldLife > 0);
		const pulse = boosted
			? 0.9 + 0.22 * Math.sin(T / 110)
			: 0.82 + 0.18 * Math.sin(T / 160);
		const cs = this.cellSize;
		// Photon is a small but intense electric node (scaled down to be smaller)
		const rp = cs * (boosted ? 0.2 : 0.18) * pulse;
		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		// Far outer corona
		let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 1.2);
		g.addColorStop(0, "rgba(0,229,255,0.25)");
		g.addColorStop(0.45, "rgba(0,180,255,0.1)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, cs * 1.2, 0, Math.PI * 2); ctx.fill();

		// Bright mid halo
		g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rp * 2.8);
		g.addColorStop(0, boosted ? "rgba(180,245,255,0.92)" : "rgba(100,240,255,0.75)");
		g.addColorStop(0.5, boosted ? "rgba(60,210,255,0.55)" : "rgba(0,200,255,0.35)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rp * 2.8, 0, Math.PI * 2); ctx.fill();

		// White-hot core
		ctx.shadowBlur = 25 * pulse;
		ctx.shadowColor = "rgba(0,229,255,1)";
		g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rp);
		g.addColorStop(0, "#ffffff");
		g.addColorStop(0.4, "rgba(180,255,255,1)");
		g.addColorStop(1, "rgba(0,150,255,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rp, 0, Math.PI * 2); ctx.fill();

		if (boosted) {
			const ringR = cs * (0.36 + 0.05 * Math.sin(T / 130));
			ctx.strokeStyle = "rgba(130, 240, 255, 0.8)";
			ctx.lineWidth = Math.max(1, cs * 0.06);
			ctx.shadowBlur = cs * 0.5;
			ctx.shadowColor = "rgba(80, 220, 255, 0.9)";
			ctx.beginPath();
			ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
			ctx.stroke();
		}

		if (shielded) {
			const shieldR = cs * 0.46;
			ctx.strokeStyle = "rgba(180, 255, 255, 0.65)";
			ctx.lineWidth = Math.max(1, cs * 0.04);
			ctx.shadowBlur = cs * 0.45;
			ctx.shadowColor = "rgba(180, 255, 255, 0.8)";
			ctx.beginPath();
			ctx.arc(cx, cy, shieldR, 0, Math.PI * 2);
			ctx.stroke();
		}

		ctx.restore();
	}

	// ── ELECTRON (Chaser) — small orange-white plasma fireball ────────────────
	// Visual inspiration: the central orange nucleus in the reference image
	_drawElectron(ctx, cx, cy, r, _color) {
		const T = performance.now();
		const pulse = 0.90 + 0.10 * Math.sin(T / 200);
		const cs = this.cellSize;
		// Scaled down core size
		const rCore = cs * 0.20 * pulse;
		const rFar = cs * 1.5;          // ambient heat haze
		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		// Heat haze — vast warm orange cloud
		let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rFar);
		g.addColorStop(0, "rgba(255,120,10,0.40)");
		g.addColorStop(0.3, "rgba(220,70,5,0.20)");
		g.addColorStop(0.65, "rgba(160,30,0,0.08)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rFar, 0, Math.PI * 2); ctx.fill();

		// Tight bright plasma core
		g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rCore);
		g.addColorStop(0, "#ffffff");
		g.addColorStop(0.12, "rgba(255,250,200,1)");
		g.addColorStop(0.35, "rgba(255,180,40,1)");
		g.addColorStop(0.7, "rgba(240,70,0,0.90)");
		g.addColorStop(1, "rgba(80,0,0,0)");
		ctx.shadowBlur = cs * 1.0 * pulse;
		ctx.shadowColor = "rgba(255,160,30,1)";
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rCore, 0, Math.PI * 2); ctx.fill();

		// White molten centre flash
		ctx.globalCompositeOperation = "source-over";
		g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rCore * 0.28);
		g.addColorStop(0, "rgba(255,255,255,0.98)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rCore * 0.28, 0, Math.PI * 2); ctx.fill();

		ctx.restore();
	}

	// ── HEALER — large emerald orb + flash rays ─────────────────────────────
	_drawHealer(ctx, cx, cy, r, _color) {
		const T = performance.now();
		const pulse = 0.72 + 0.28 * Math.sin(T / 380);
		const cs = this.cellSize;
		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		// Outer healing aura (scaled down)
		let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 1.2 * pulse);
		g.addColorStop(0, "rgba(40,220,120,0.15)");
		g.addColorStop(0.5, "rgba(20,160,80,0.05)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, cs * 1.2 * pulse, 0, Math.PI * 2); ctx.fill();

		// ── Radial light rays (Healer: Emerald Green) ──
		const nRays = 8;
		const tOff = T / 4000;
		for (let i = 0; i < nRays; i++) {
			const a = (i / nRays) * Math.PI * 2 + tOff;
			const longRay = i % 2 === 0;
			// Rays scaled down
			const rLen = cs * (longRay ? (2.4 + 0.6 * Math.sin(T / 500 + i)) : (1.5 + 0.3 * Math.sin(T / 380 + i)));
			const x2 = cx + Math.cos(a) * rLen;
			const y2 = cy + Math.sin(a) * rLen;
			const lg = ctx.createLinearGradient(cx, cy, x2, y2);
			const alpha = ((longRay ? 0.45 : 0.25) + 0.15 * Math.sin(T / 350 + i * 1.9)) * 0.85;
			lg.addColorStop(0, `rgba(200,255,220,${alpha})`);
			lg.addColorStop(0.2, `rgba(60,220,120,${alpha * 0.6})`);
			lg.addColorStop(1, "rgba(0,100,40,0)");
			ctx.strokeStyle = lg;
			ctx.lineWidth = longRay ? cs * 0.10 : cs * 0.05;
			ctx.shadowBlur = cs * 0.4;
			ctx.shadowColor = "rgba(60,220,120,0.6)";
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}

		// Core emerald glow (scaled up to match electrons)
		const rc = cs * 0.32 * pulse; // Was 0.25
		g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rc);
		g.addColorStop(0, "rgba(200,255,220,0.95)");
		g.addColorStop(0.4, "rgba(60,220,120,0.80)");
		g.addColorStop(1, "rgba(0,100,40,0)");
		ctx.shadowBlur = cs * 0.4 * pulse;
		ctx.shadowColor = "rgba(40,220,120,0.8)";
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rc, 0, Math.PI * 2); ctx.fill();

		ctx.restore();
	}

	// ── SPEEDER — large bright red electric pulse + flash rays ─────────────────
	_drawSpeeder(ctx, cx, cy, r, _color) {
		const T = performance.now();
		const pulse = 0.78 + 0.22 * Math.sin(T / 220);
		const cs = this.cellSize;
		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		// Wide red aura (scaled down)
		let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 1.2);
		g.addColorStop(0, "rgba(255,60,60,0.15)");
		g.addColorStop(0.5, "rgba(200,20,20,0.05)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, cs * 1.2, 0, Math.PI * 2); ctx.fill();

		// ── Radial light rays (Speeder: Bright Red) ──
		const nRays = 8;
		const tOff = T / 4000;
		for (let i = 0; i < nRays; i++) {
			const a = (i / nRays) * Math.PI * 2 + tOff;
			const longRay = i % 2 === 0;
			// Rays scaled down
			const rLen = cs * (longRay ? (2.4 + 0.6 * Math.sin(T / 500 + i)) : (1.5 + 0.3 * Math.sin(T / 380 + i)));
			const x2 = cx + Math.cos(a) * rLen;
			const y2 = cy + Math.sin(a) * rLen;
			const lg = ctx.createLinearGradient(cx, cy, x2, y2);
			const alpha = ((longRay ? 0.45 : 0.25) + 0.15 * Math.sin(T / 350 + i * 1.9)) * 0.85;
			lg.addColorStop(0, `rgba(255,200,200,${alpha})`);
			lg.addColorStop(0.2, `rgba(255,40,40,${alpha * 0.6})`);
			lg.addColorStop(1, "rgba(100,0,0,0)");
			ctx.strokeStyle = lg;
			ctx.lineWidth = longRay ? cs * 0.10 : cs * 0.05;
			ctx.shadowBlur = cs * 0.4;
			ctx.shadowColor = "rgba(255,40,40,0.6)";
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}

		// Bright red-white orb (scaled up to match electrons)
		const rc = cs * 0.32 * pulse; // Was 0.25
		g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rc);
		g.addColorStop(0, "rgba(255,200,200,0.95)");
		g.addColorStop(0.4, "rgba(255,60,60,0.85)");
		g.addColorStop(1, "rgba(200,0,0,0)");
		ctx.shadowBlur = cs * 0.5 * pulse;
		ctx.shadowColor = "rgba(255,50,50,0.8)";
		ctx.fillStyle = g;
		ctx.beginPath(); ctx.arc(cx, cy, rc, 0, Math.PI * 2); ctx.fill();

		ctx.restore();
	}

	_drawBoostedElectronTrail(ctx, startX, startY, cx, cy, cs) {
		const dx = cx - startX;
		const dy = cy - startY;
		const dist = Math.hypot(dx, dy);
		if (dist < cs * 0.25) return;

		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		const gx = cx - dx * 0.9;
		const gy = cy - dy * 0.9;
		const grad = ctx.createLinearGradient(cx, cy, gx, gy);
		grad.addColorStop(0, "rgba(255,210,120,0.95)");
		grad.addColorStop(0.35, "rgba(255,110,40,0.58)");
		grad.addColorStop(1, "rgba(255,40,40,0)");

		ctx.strokeStyle = grad;
		ctx.lineWidth = Math.max(1.8, cs * 0.18);
		ctx.shadowBlur = cs * 0.55;
		ctx.shadowColor = "rgba(255,110,40,0.8)";
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(gx, gy);
		ctx.stroke();

		ctx.restore();
	}

	_drawBoostedElectronGhosts(ctx, startX, startY, cx, cy, cs) {
		const dx = cx - startX;
		const dy = cy - startY;
		const dist = Math.hypot(dx, dy);
		if (dist < cs * 0.35) return;

		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		const ghostRadius = cs * 0.16;
		const points = [0.28, 0.56];
		for (let i = 0; i < points.length; i++) {
			const t = points[i];
			const gx = cx - dx * t;
			const gy = cy - dy * t;
			const alpha = 0.22 - i * 0.08;
			ctx.fillStyle = `rgba(255, 180, 120, ${alpha.toFixed(3)})`;
			ctx.beginPath();
			ctx.arc(gx, gy, ghostRadius, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.restore();
	}

	// ── OBSTACLE — dark void tile, barely visible ─────────────────────────────
	_drawObstacle(ctx, cx, cy, cs) {
		const s = cs * 0.85;
		const x = cx - s / 2;
		const y = cy - s / 2;
		ctx.save();

		// Subtle outer glow
		ctx.shadowBlur = cs * 0.3;
		ctx.shadowColor = "rgba(0, 229, 255, 0.25)";

		ctx.fillStyle = "rgba(10, 18, 42, 0.95)";
		ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
		ctx.lineWidth = 1.0;

		ctx.beginPath();
		ctx.roundRect(x, y, s, s, 4);
		ctx.fill();
		ctx.stroke();

		ctx.restore();
	}

	// ── ENERGY NODE ───────────────────────────────────────────────────────────
	_drawEnergyNode(ctx, cx, cy, r, color, lifeRatio) {
		const t = performance.now() / 250;
		const pulse = 1 + 0.2 * Math.sin(t);
		const rc = r * Math.max(0.6, lifeRatio) * pulse;

		ctx.save();
		ctx.globalCompositeOperation = "lighter";

		// 1. Soft radial gradient glow (matches Electrons/Photons perfectly)
		const glowR = rc * 2.5;
		const gRadius = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
		gRadius.addColorStop(0, '#ffffff'); // pure white hot core
		gRadius.addColorStop(0.2, colorWithAlpha(color, 0.9)); // intense colored inner halo
		gRadius.addColorStop(0.5, colorWithAlpha(color, 0.4)); // fading colored plasma
		gRadius.addColorStop(1, colorWithAlpha(color, 0)); // transparent edge

		ctx.fillStyle = gRadius;
		ctx.beginPath();
		ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		// 2. Heavy particle emission (swirling storm effect)
		// Emitting multiple particles per frame makes it look like a dense energy well
		const emitChance = this.fxQuality === 'low' ? 0.45 : 0.9;
		const emitCount = this.fxQuality === 'low' ? 1 : 2;
		if (Math.random() < emitChance) {
			for (let i = 0; i < emitCount; i++) {
				const angle = performance.now() / 200 + Math.random() * Math.PI * 2;
				const dist = Math.random() * (r * 3.5) + r;
				const pX = cx + Math.cos(angle) * dist;
				const pY = cy + Math.sin(angle) * dist;

				this.particles.push({
					x: pX, y: pY,
					vx: (cx - pX) * 0.08 + Math.cos(angle + Math.PI / 2) * 0.4,
					vy: (cy - pY) * 0.08 + Math.sin(angle + Math.PI / 2) * 0.4,
					life: Math.random() * 120 + 50,
					maxLife: 200,
					color: Math.random() < 0.25 ? '#ffffff' : color,
					size: Math.random() * 2 + 1,
					isLine: false,
					isCloud: Math.random() > 0.4
				});
			}
		}
	}

	// ── INTERACTION EFFECTS ───────────────────────────────────────────────────
	_spawnRipple(x, y) {
		// Soft click feedback, lighter than combat explosions
		this.spawnFlash(x, y, "rgba(0, 229, 255, 0.9)", this.fxQuality === 'low' ? 0.7 : 1.1);

		// Reduced geometric network nodes for better click performance
		const rippleNodes = Math.max(1, Math.round(3 * this.fxMultiplier));
		for (let i = 0; i < rippleNodes; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 2.2 + 0.8;
			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 220 + 120,
				maxLife: 340,
				color: "rgba(0, 229, 255, 1)",
				size: Math.random() * 1.3 + 0.6,
				isNetworkNode: true
			});
		}

		// Displace existing sparks outwards
		for (const p of this.particles) {
			const dx = p.x - x;
			const dy = p.y - y;
			const dist = Math.hypot(dx, dy);
			const pushRadius = this.cellSize * 4;
			if (dist < pushRadius && dist > 1) {
				const force = (pushRadius - dist) / pushRadius;
				p.vx += (dx / dist) * force * 8;
				p.vy += (dy / dist) * force * 8;
			}
		}
	}

	_spawnAbsorptionWave(x, y, color) {
		// Small sparks instead of an expanding ring
		this.spawnFlash(x, y, color, 3);
	}

	_spawnDeathNova(x, y, color) {
		// 1. Standard explosion (volumetric clouds)
		this.spawnExplosion(x, y, color);
		this.spawnFlash(x, y, color, this.fxQuality === 'low' ? 1.0 : 1.5);

		// 2. Geometric network nodes (the fine lines) - Reduced count for performance
		const nodeCount = Math.max(3, Math.round(8 * this.fxMultiplier));
		for (let i = 0; i < nodeCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 4 + 2;
			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 600 + 300,
				maxLife: 900,
				color: color,
				size: Math.random() * 2 + 1,
				isNetworkNode: true
			});
		}
	}

	_updateEnergyRings(dt) {
		const decay = dt / 480;
		let i = this.energyRings.length;
		while (i--) {
			const ring = this.energyRings[i];
			ring.life -= decay;
			ring.r += (ring.maxR - ring.r) * (dt / 220);
			if (ring.life <= 0) this.energyRings.splice(i, 1);
		}
	}

	_drawEnergyRings(ctx) {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		for (const ring of this.energyRings) {
			const alpha = ring.life * (ring.type === 'death' ? 0.9 : (ring.type === 'ripple' ? 0.4 : 0.6));

			// Handle rgb strings vs rgba strings for ripples
			const colorStr = ring.color.includes('rgba') || ring.color.includes('#')
				? colorWithAlpha(ring.color, alpha)
				: `rgba(${ring.color}, ${alpha})`;

			ctx.strokeStyle = colorStr;
			ctx.lineWidth = ring.type === 'death' ? 2.5 : (ring.type === 'ripple' ? 3.0 : 1.5);
			ctx.shadowBlur = ring.type === 'ripple' ? 20 : 12;
			ctx.shadowColor = colorStr;
			ctx.beginPath();
			ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.restore();
	}

	// ── PARTICLE SPARKS ───────────────────────────────────────────────────────
	spawnFlash(x, y, color, intensityMultiplier = 1) {
		const count = Math.max(2, Math.round(Math.min(6 * intensityMultiplier * this.fxMultiplier, this.fxQuality === 'low' ? 7 : 12)));
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 3 * intensityMultiplier + 0.5;
			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 250 + 100,
				maxLife: 350,
				color,
				size: Math.random() * 3 + 1,
				isLine: false,
				isCloud: true
			});
		}
	}

	spawnExplosion(x, y, color) {
		// Medium volumetric burst - quality aware
		const burstCount = Math.max(6, Math.round(15 * this.fxMultiplier));
		for (let i = 0; i < burstCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speedStr = Math.pow(Math.random(), 1.5);
			const speed = speedStr * 5 + 1.2;
			const isCore = speedStr < 0.35;

			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 400 + 150,
				maxLife: 550,
				color: isCore ? "#ffffff" : color,
				size: isCore ? (Math.random() * 2 + 1) : (Math.random() * 4 + 2),
				isLine: false,
				isCloud: !isCore
			});
		}
	}

	updateParticles(dt) {
		let i = this.particles.length;
		// Hard limit (quality aware) to preserve FPS
		if (i > this.maxParticles) this.particles.splice(0, i - this.maxParticles);

		i = this.particles.length;
		while (i--) {
			const p = this.particles[i];
			p.life -= dt;
			if (p.life <= 0) { this.particles.splice(i, 1); continue; }
			p.x += p.vx * (dt / 16);
			p.y += p.vy * (dt / 16);
			p.vx *= 0.91;
			p.vy *= 0.91;
		}
	}

	drawParticles(ctx) {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		for (const p of this.particles) {
			const alpha = Math.max(0, p.life / p.maxLife);

			// Apply Lattice Deformation to particles too
			const def = this.getDeformationAt(p.x, p.y);
			const drawX = p.x + def.dx;
			const drawY = p.y + def.dy;

			if (p.isLine) {
				// High energy ray (kept for specific directional bursts if needed later)
				ctx.beginPath();
				ctx.moveTo(drawX, drawY);
				ctx.lineTo(drawX - p.vx * 3.5, drawY - p.vy * 3.5);
				ctx.strokeStyle = colorWithAlpha(p.color, alpha);
				ctx.lineWidth = p.size;
				ctx.shadowBlur = p.size * 2;
				ctx.shadowColor = p.color;
				ctx.stroke();
			} else if (p.isCloud) {
				const size = p.size * (1 + (1 - alpha) * 0.5);
				ctx.fillStyle = colorWithAlpha(p.color, alpha * 0.4); // Simple fill instead of radial gradient
				ctx.beginPath();
				ctx.arc(drawX, drawY, size, 0, Math.PI * 2);
				ctx.fill();
			} else if (p.isLine) {
				// Kinetic shards or standard lines
				const alpha = Math.max(0, p.life / p.maxLife);
				const len = p.isKinetic ? 12 : 3.5;
				ctx.beginPath();
				ctx.moveTo(drawX, drawY);
				ctx.lineTo(drawX - p.vx * len, drawY - p.vy * len);

				if (p.isKinetic) {
					// Chromatic streak
					ctx.strokeStyle = colorWithAlpha('#ffffff', alpha);
					ctx.lineWidth = p.size * 1.5;
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(drawX, drawY);
					ctx.lineTo(drawX - p.vx * (len * 0.6), drawY - p.vy * (len * 0.6));
					ctx.strokeStyle = colorWithAlpha(p.secondaryColor || p.color, alpha * 0.6);
					ctx.lineWidth = p.size * 3;
					ctx.stroke();
				} else {
					ctx.strokeStyle = colorWithAlpha(p.color, alpha);
					ctx.lineWidth = p.size;
					ctx.stroke(); // Removed shadowBlur for standard lines
				}
			} else {
				const r = p.size * alpha + 0.3;
				ctx.fillStyle = colorWithAlpha(p.color, alpha * 0.8);
				ctx.beginPath();
				ctx.arc(drawX, drawY, r, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		ctx.restore();
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
const inpQuality = document.getElementById("inp-quality");
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
let cntFps = document.getElementById("cnt-fps");
let cntLogic = document.getElementById("cnt-logic");
let cntProfile = document.getElementById("cnt-profile");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlay-msg");
const CORE_PANEL_SETTINGS_KEY = "particles.core.panel.v1";

let logicMsLast = 0;
let logicMsAvg = 0;
let currentRenderProfile = 'balanced';
let lastStatsUiUpdateMs = 0;
const STATS_UPDATE_INTERVAL_MS = 120;

function recordLogicFrame(ms) {
	logicMsLast = ms;
	if (logicMsAvg <= 0) logicMsAvg = ms;
	else logicMsAvg = logicMsAvg * 0.85 + ms * 0.15;
}

window.__recordLogicFrame = recordLogicFrame;

if (!cntFps) {
	const topBarInfo = document.querySelector(".top-bar-info");
	if (topBarInfo) {
		cntFps = document.createElement("span");
		cntFps.id = "cnt-fps";
		cntFps.className = "logo-sub";
		cntFps.style.marginLeft = "10px";
		cntFps.textContent = "FPS: --";
		topBarInfo.appendChild(cntFps);
	}
}

if (!cntLogic) {
	const topBarInfo = document.querySelector(".top-bar-info");
	if (topBarInfo) {
		cntLogic = document.createElement("span");
		cntLogic.id = "cnt-logic";
		cntLogic.className = "logo-sub";
		cntLogic.style.marginLeft = "10px";
		cntLogic.textContent = "Logic: -- ms";
		topBarInfo.appendChild(cntLogic);
	}
}

if (!cntProfile) {
	const topBarInfo = document.querySelector(".top-bar-info");
	if (topBarInfo) {
		cntProfile = document.createElement("span");
		cntProfile.id = "cnt-profile";
		cntProfile.className = "logo-sub";
		cntProfile.style.marginLeft = "10px";
		cntProfile.style.cursor = "pointer";
		cntProfile.textContent = "Profile: BALANCED";
		topBarInfo.appendChild(cntProfile);
	}
}

const renderer = canvas ? new Renderer(canvas) : null;
let board;
let elements;
let logicRunning = false;
let logicTimer = 0;
let animFrameId = null;
let paused = false;
let turn = 0;
let idleMoves = 0;

function setRenderProfile(mode) {
	currentRenderProfile = mode === 'performance' ? 'performance' : 'balanced';
	if (renderer) renderer.setRenderProfile(currentRenderProfile);
	if (cntProfile) cntProfile.textContent = `Profile: ${currentRenderProfile.toUpperCase()}`;
	saveCorePanelSettings();
}

function toggleRenderProfile() {
	setRenderProfile(currentRenderProfile === 'balanced' ? 'performance' : 'balanced');
	updateStats(true);
}

function saveCorePanelSettings() {
	try {
		const payload = {
			rows: inpRows ? inpRows.value : undefined,
			cols: inpCols ? inpCols.value : undefined,
			speed: inpSpeed ? inpSpeed.value : undefined,
			quality: inpQuality ? inpQuality.value : undefined,
			run: inpRun ? inpRun.value : undefined,
			cha: inpCha ? inpCha.value : undefined,
			obs: inpObs ? inpObs.value : undefined,
			hea: inpHea ? inpHea.value : undefined,
			spe: inpSpe ? inpSpe.value : undefined,
			profile: currentRenderProfile
		};
		localStorage.setItem(CORE_PANEL_SETTINGS_KEY, JSON.stringify(payload));
	} catch (_) {
		// Ignore storage failures (private mode, disabled storage, etc.)
	}
}

function loadCorePanelSettings() {
	try {
		const raw = localStorage.getItem(CORE_PANEL_SETTINGS_KEY);
		if (!raw) return;
		const payload = JSON.parse(raw);
		if (!payload || typeof payload !== "object") return;

		if (inpRows && payload.rows != null) inpRows.value = String(payload.rows);
		if (inpCols && payload.cols != null) inpCols.value = String(payload.cols);
		if (inpSpeed && payload.speed != null) inpSpeed.value = String(payload.speed);
		if (inpQuality && payload.quality != null) inpQuality.value = String(payload.quality);
		if (inpRun && payload.run != null) inpRun.value = String(payload.run);
		if (inpCha && payload.cha != null) inpCha.value = String(payload.cha);
		if (inpObs && payload.obs != null) inpObs.value = String(payload.obs);
		if (inpHea && payload.hea != null) inpHea.value = String(payload.hea);
		if (inpSpe && payload.spe != null) inpSpe.value = String(payload.spe);
		if (payload.profile === 'performance' || payload.profile === 'balanced') {
			currentRenderProfile = payload.profile;
		}
	} catch (_) {
		// Ignore malformed storage payload
	}
}

function attachCoreSettingsPersistence() {
	const controls = [inpRows, inpCols, inpSpeed, inpQuality, inpRun, inpCha, inpObs, inpHea, inpSpe];
	for (const el of controls) {
		if (!el) continue;
		el.addEventListener("change", saveCorePanelSettings);
		el.addEventListener("blur", saveCorePanelSettings);
	}
}

function getRows() {
	const rows = inpRows ? parseInt(inpRows.value, 10) : 40;
	if (!Number.isFinite(rows)) return 40;
	return Math.max(10, Math.min(100, rows));
}
function getCols() {
	const cols = inpCols ? parseInt(inpCols.value, 10) : 60;
	if (!Number.isFinite(cols)) return 60;
	return Math.max(10, Math.min(100, cols));
}

function readCountInput(inputEl, fallback, min, max) {
	if (!inputEl) return fallback;
	const raw = parseInt(inputEl.value, 10);
	if (!Number.isFinite(raw)) {
		inputEl.value = String(fallback);
		return fallback;
	}
	const clamped = Math.max(min, Math.min(max, raw));
	if (clamped !== raw) inputEl.value = String(clamped);
	return clamped;
}

function getCounts() {
	return {
		runners: readCountInput(inpRun, 20, 1, 100),
		chasers: readCountInput(inpCha, 20, 1, 100),
		obstacles: readCountInput(inpObs, 50, 0, 200),
		healers: readCountInput(inpHea, 5, 0, 50),
		speeders: readCountInput(inpSpe, 5, 0, 50)
	};
}
function getSpeedMs() { return inpSpeed ? Math.round(1000 / parseInt(inpSpeed.value, 10)) : 500; }
function getFxQuality() {
	if (!inpQuality) return 'high';
	return inpQuality.value === 'low' ? 'low' : 'high';
}

function applyBoardSizeInputs() {
	if (!inpRows || !inpCols) return;
	inpRows.value = String(getRows());
	inpCols.value = String(getCols());
}

function handleBoardResizeControlChange() {
	applyBoardSizeInputs();
	if (board) resetGame();
}

function initGame() {
    if (!renderer) return;
	updateColorsFromCSS();
	const rows = getRows();
	const cols = getCols();
	board = new Board(rows, cols);
	elements = [];
	ElementsGenerator.generateElements(board, getCounts(), elements);
	board.placeElements(elements);
	renderer.resize(rows, cols);
	renderer.setFxQuality(getFxQuality());
	renderer.setRenderProfile(currentRenderProfile);
	turn = 0;
	idleMoves = 0;
	if (typeof updateStats === 'function') updateStats(true);
	const ms = getSpeedMs();
	renderer.setTurnSpeed(ms);
	renderer.updateLogicState(elements, board);
	renderer.attachMouseEvents();
	if (overlay) overlay.classList.add("hidden");

	logicTimer = performance.now();
	if (animFrameId !== null) cancelAnimationFrame(animFrameId);
	animLoop(performance.now());
}

function tick() {
	const tickStartMs = performance.now();
	if (paused) return;
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
	const erased = elements.length < prevLen;
	const runnersCount = ListUtils.countCharacters(elements, "Runner");
	const chasersCount = ListUtils.countCharacters(elements, "Chaser");
	board.placeElements(elements);
	renderer.updateLogicState(elements, board);
	if (erased) idleMoves = 0; else idleMoves++;
	turn++;
	updateStats();
	if (runnersCount === 0 || chasersCount === 0 || idleMoves >= 50) {
		stopGame();
		showWinner(runnersCount, chasersCount);
	}
	if (typeof window.__recordLogicFrame === 'function') {
		window.__recordLogicFrame(performance.now() - tickStartMs);
	}
}

function animLoop(time) {
	if (!renderer.lastTime) renderer.lastTime = time;
	const ms = getSpeedMs();

	if (logicRunning && !paused) {
		// If real-time jump is more than 3x speed, we reset logicTimer
		if (time - logicTimer > ms * 3) logicTimer = time - ms;

		while (time - logicTimer >= ms) {
			tick();
			logicTimer += ms;
			// Pass current logic sync point to renderer for smooth interpolation
			renderer.logicTimer = logicTimer;
		}
	} else {
		// When stopped/paused, keep progress frozen or resetting
		renderer.logicTimer = time - ms;
	}

	renderer.drawFrame(time, ms);
	animFrameId = requestAnimationFrame(animLoop);
}

function startGame() {
	if (logicRunning) return;
	updateColorsFromCSS(); // Ensure colors are fresh when starting
	paused = false;
	logicRunning = true;
	logicTimer = performance.now();
	const ms = getSpeedMs();
	renderer.setTurnSpeed(ms);
	btnStart.setAttribute("disabled", "");
	btnPause.removeAttribute("disabled");
}

function pauseGame() {
	paused = !paused;
	if (!paused) logicTimer = performance.now(); // reset timer on resume to avoid jump
	btnPause.textContent = paused ? "▶ Resume" : "⏸ Pause";
}

function stopGame() {
	logicRunning = false;
	btnStart.removeAttribute("disabled");
	btnPause.setAttribute("disabled", "");
	btnPause.textContent = "⏸ Pause";
	paused = false;
}

function resetGame() {
	updateColorsFromCSS(); // Proactive update
	stopGame();
	initGame();
}

function showWinner(runners, chasers) {
	let msg;
	if (runners === 0 && chasers === 0) msg = "⚡ It's a Tie!";
	else if (runners === 0) msg = "🔴 Electrons Win!";
	else if (chasers === 0) msg = "🔵 Photons Win!";
	else msg = "⏱ Time's up! It's a Draw.";
	overlayMsg.textContent = msg;
	overlay.classList.remove("hidden");
}

function updateStats(force = false) {
    if (!cntRunners || !cntChasers || !cntTurn) return;
	const now = performance.now();
	if (!force && now - lastStatsUiUpdateMs < STATS_UPDATE_INTERVAL_MS) return;
	lastStatsUiUpdateMs = now;
	const runners = ListUtils.countCharacters(elements ?? [], "Runner");
	const chasers = ListUtils.countCharacters(elements ?? [], "Chaser");
	cntRunners.textContent = String(runners);
	cntChasers.textContent = String(chasers);
	cntTurn.textContent = String(turn);
	if (cntFps && renderer) cntFps.textContent = `FPS: ${renderer.fps || 0}`;
	if (cntLogic) cntLogic.textContent = `Logic: ${logicMsAvg.toFixed(1)} ms`;
	if (cntProfile) cntProfile.textContent = `Profile: ${currentRenderProfile.toUpperCase()}`;
}

// ── LISTENERS ────────────────────────────────────────────────────────────────

if (inpSpeed) {
    inpSpeed.addEventListener("input", () => {
        const ms = getSpeedMs();
        renderer.setTurnSpeed(ms);
    });
}

if (inpQuality) {
	inpQuality.addEventListener("change", () => {
		if (renderer) renderer.setFxQuality(getFxQuality());
		updateStats(true);
		saveCorePanelSettings();
	});
}

if (cntProfile) cntProfile.addEventListener("click", toggleRenderProfile);

if (inpRows) {
	inpRows.addEventListener("change", handleBoardResizeControlChange);
	inpRows.addEventListener("blur", handleBoardResizeControlChange);
}

if (inpCols) {
	inpCols.addEventListener("change", handleBoardResizeControlChange);
	inpCols.addEventListener("blur", handleBoardResizeControlChange);
}

if (btnStart) btnStart.addEventListener("click", () => { if (!board) initGame(); startGame(); });
if (btnPause) btnPause.addEventListener("click", pauseGame);
if (btnReset) btnReset.addEventListener("click", resetGame);
const overlayBtn = document.getElementById("btn-overlay-reset");
if (overlayBtn) overlayBtn.addEventListener("click", resetGame);

let resizeDebounceTimer = null;
window.addEventListener("resize", () => {
	if (resizeDebounceTimer !== null) clearTimeout(resizeDebounceTimer);
	resizeDebounceTimer = setTimeout(() => {
		if (board && renderer) {
			updateColorsFromCSS();
			renderer.resize(board.rows, board.cols);
			renderer.updateLogicState(elements, board);
		}
	}, 200);
});

window.addEventListener("focus", () => {
	updateColorsFromCSS();
	if (board && renderer) renderer.updateLogicState(elements, board);
});

window.addEventListener("keydown", (e) => {
	if (!e.shiftKey || e.key.toLowerCase() !== 'p') return;
	e.preventDefault();
	toggleRenderProfile();
});

loadCorePanelSettings();
attachCoreSettingsPersistence();

// Initialization - Don't auto-init if a custom mode script handles bootstrapping
if (!window.location.href.includes('game.html') && !window.location.href.includes('levels.html')) {
	applyBoardSizeInputs();
	if (inpQuality) inpQuality.value = getFxQuality();
    initGame();
}
