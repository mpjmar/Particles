import { Board } from "../board/Board.js";
import { BoardElement } from "../boardElements/BoardElement.js";
import { Runner } from "../boardElements/Runner.js";
import { Chaser } from "../boardElements/Chaser.js";
import { Healer } from "../boardElements/Healer.js";
import { Speeder } from "../boardElements/Speeder.js";
import { Obstacle } from "../boardElements/Obstacle.js";
import { Role } from "../boardElements/Role.js";
import { EventManager, VfxEvent } from "../utils/EventManager.js";

// Colours
const C_BG = "#050d1a";
const C_RUNNER = "#3b82f6"; // blue electrons
const C_CHASER = "#ef4444"; // red electrons
const C_HEALER = "#22c55e"; // green
const C_SPEEDER = "#a855f7"; // purple
const C_OBSTACLE = "#374151"; // dark grey
const C_GLOW_R = "rgba(59,130,246,0.35)";
const C_GLOW_C = "rgba(239,68,68,0.35)";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	color: string;
	size: number;
}

export class Renderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private cellSize = 0;
	private particles: Particle[] = [];
	private board: Board | null = null;
	private elements: BoardElement[] = [];

	// Animation state
	private lastTime = 0;
	private turnProgress = 1; // 0.0 to 1.0 (interpolation)
	private turnDurationMs = 500;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
	}

	resize(rows: number, cols: number): void {
		const maxW = this.canvas.parentElement?.clientWidth ?? 800;
		const maxH = this.canvas.parentElement?.clientHeight ?? 600;
		this.cellSize = Math.max(4, Math.min(Math.floor(maxW / cols), Math.floor(maxH / rows)));
		this.canvas.width = cols * this.cellSize;
		this.canvas.height = rows * this.cellSize;
	}

	setTurnSpeed(ms: number) {
		this.turnDurationMs = ms;
	}

	// Called by main.ts every logic tick
	updateLogicState(elements: BoardElement[], board: Board) {
		this.elements = elements;
		this.board = board;
		this.turnProgress = 0; // reset interpolation

		// Process VFX events that happened this tick
		const events = EventManager.consumeAll();
		for (const ev of events) {
			const cx = ev.col * this.cellSize + this.cellSize / 2;
			const cy = ev.row * this.cellSize + this.cellSize / 2;
			if (ev.type === "fight") this.spawnFlash(cx, cy, ev.color || "#fff", 2);
			if (ev.type === "death") {
				this.spawnFlash(cx, cy, "#ffffff", 6); // Extra bright pre-death flash
				this.spawnExplosion(cx, cy, ev.color || "#fff");
			}
		}
	}

	// Called by main.ts in requestAnimationFrame
	drawFrame(timeMs: number): void {
		const dt = timeMs - this.lastTime;
		this.lastTime = timeMs;

		// Move progress forward
		if (this.turnProgress < 1) {
			this.turnProgress += dt / this.turnDurationMs;
			if (this.turnProgress > 1) this.turnProgress = 1;
		}

		this.updateParticles(dt);
		this.renderAll();
	}

	private renderAll(): void {
		if (!this.board) return;
		const ctx = this.ctx;
		const cs = this.cellSize;

		// Background
		ctx.fillStyle = C_BG;
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Subtle dot-grid
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

		// Draw logic elements with interpolation
		// Use linear easing for fluid, continuous movement
		const ease = this.turnProgress;

		for (const e of this.elements) {
			let targetX = e.col * cs + cs / 2;
			let targetY = e.row * cs + cs / 2;
			let startX = targetX;
			let startY = targetY;

			// If it's a role and has a previous position, interpolate
			if (e instanceof Role) {
				const prevPos = (e as any).prevPos;
				if (prevPos) {
					startX = prevPos.col * cs + cs / 2;
					startY = prevPos.row * cs + cs / 2;
				}
			}

			const cx = startX + (targetX - startX) * ease;
			const cy = startY + (targetY - startY) * ease;
			// Smaller radius for elements as requested
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

			// Draw trails for moving elements
			if (startX !== targetX || startY !== targetY) {
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(cx, cy);
				ctx.strokeStyle = e instanceof Runner ? "rgba(59,130,246,0.2)" : "rgba(239,68,68,0.2)";
				ctx.lineWidth = r * 0.8;
				ctx.lineCap = "round";
				ctx.stroke();
			}

			if (e instanceof Runner) {
				this.drawElectron(ctx, cx, cy, r, C_RUNNER);
				continue;
			}

			if (e instanceof Chaser) {
				this.drawElectron(ctx, cx, cy, r, C_CHASER);
				continue;
			}

			if (e instanceof Healer) {
				this.drawElectron(ctx, cx, cy, r * 1.1, C_HEALER);
				continue;
			}

			if (e instanceof Speeder) {
				this.drawElectron(ctx, cx, cy, r * 1.1, C_SPEEDER);
			}
		}

		this.drawParticles(ctx);
	}

	// ── Visual Effects (Particles) ────────────────────────────────────────────────

	private spawnFlash(x: number, y: number, color: string, intensityMultiplier: number = 1) {
		// Expanding particles
		for (let i = 0; i < 5 * intensityMultiplier; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 3 * intensityMultiplier + 1;
			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 200 + 100,
				maxLife: 300,
				color,
				size: Math.random() * 4 + 2
			});
		}
	}

	private spawnExplosion(x: number, y: number, color: string) {
		// A burst of many particles
		for (let i = 0; i < 25; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 6 + 2;
			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 400 + 200,
				maxLife: 600,
				color,
				size: Math.random() * 3 + 1
			});
		}
	}

	private updateParticles(dt: number) {
		let i = this.particles.length;
		while (i--) {
			const p = this.particles[i];
			p.life -= dt;
			if (p.life <= 0) {
				this.particles.splice(i, 1);
				continue;
			}
			p.x += p.vx * (dt / 16);
			p.y += p.vy * (dt / 16);
			p.vx *= 0.92; // friction
			p.vy *= 0.92;
		}
	}

	private drawParticles(ctx: CanvasRenderingContext2D) {
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

	// ── Drawing Helpers ─────────────────────────────────────────────────────────

	private drawGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
		const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
		grad.addColorStop(0, color);
		grad.addColorStop(1, "transparent");
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fill();
	}

	private drawElectron(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
		const pulse = Math.sin(performance.now() / 200) * 0.5 + 0.5; // 0 to 1

		// Emiting the glowing animation shadow, stronger as requested
		ctx.shadowBlur = 15 + pulse * 20;
		ctx.shadowColor = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;

		// 3D Sphere radial gradient
		const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
		grad.addColorStop(0, "#ffffff");
		grad.addColorStop(0.4, color);
		grad.addColorStop(1, "rgba(0,0,0,0)");

		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fillStyle = grad;
		ctx.fill();

		// Reset shadow so it doesn't leak to other elements
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
	}

	private drawRoundedSquare(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
		const pulse = Math.sin(performance.now() / 300) * 0.5 + 0.5;
		ctx.shadowBlur = 10 + pulse * 10;
		ctx.shadowColor = color;

		const s = r * 1.5;
		const rad = 4;
		const x = cx - s / 2;
		const y = cy - s / 2;
		ctx.fillStyle = color;
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

		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
	}


}
