import { Board } from "./board/Board.js";
import { BoardElement } from "./boardElements/BoardElement.js";
import { Runner } from "./boardElements/Runner.js";
import { Chaser } from "./boardElements/Chaser.js";
import { Role } from "./boardElements/Role.js";
import { ElementsGenerator } from "./generator/ElementsGenerator.js";
import { Game } from "./gameActions/Game.js";
import { ListUtils } from "./utils/ListUtils.js";
import { Renderer } from "./ui/Renderer.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById("board-canvas") as HTMLCanvasElement;
const btnStart = document.getElementById("btn-start")!;
const btnPause = document.getElementById("btn-pause")!;
const btnReset = document.getElementById("btn-reset")!;
const inpRows = document.getElementById("inp-rows") as HTMLInputElement;
const inpCols = document.getElementById("inp-cols") as HTMLInputElement;
const lblRows = document.getElementById("lbl-rows")!;
const lblCols = document.getElementById("lbl-cols")!;
const inpSpeed = document.getElementById("inp-speed") as HTMLInputElement;
const lblSpeed = document.getElementById("lbl-speed")!;
const inpRun = document.getElementById("inp-run") as HTMLInputElement;
const inpCha = document.getElementById("inp-cha") as HTMLInputElement;
const inpObs = document.getElementById("inp-obs") as HTMLInputElement;
const inpHea = document.getElementById("inp-hea") as HTMLInputElement;
const inpSpe = document.getElementById("inp-spe") as HTMLInputElement;
const lblRun = document.getElementById("lbl-run")!;
const lblCha = document.getElementById("lbl-cha")!;
const lblObs = document.getElementById("lbl-obs")!;
const lblHea = document.getElementById("lbl-hea")!;
const lblSpe = document.getElementById("lbl-spe")!;
const cntRunners = document.getElementById("cnt-runners")!;
const cntChasers = document.getElementById("cnt-chasers")!;
const cntTurn = document.getElementById("cnt-turn")!;
const overlay = document.getElementById("overlay")!;
const overlayMsg = document.getElementById("overlay-msg")!;

// ── State ─────────────────────────────────────────────────────────────────────
const renderer = new Renderer(canvas);
let board: Board;
let elements: BoardElement[];
let logicIntervalId: ReturnType<typeof setInterval> | null = null;
let animFrameId: number | null = null;
let paused = false;
let turn = 0;
let idleMoves = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function initGame(): void {
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

	// Start render loop immediately
	if (animFrameId !== null) cancelAnimationFrame(animFrameId);
	animLoop(performance.now());
}

function tick(): void {
	if (paused) return;

	// Set targets
	for (const e of elements) {
		if (e instanceof Chaser) e.setTarget(elements);
		if (e instanceof Runner) e.setTarget(elements);
	}

	Game.playGame(elements, board);

	// Remove dead roles
	const prevLen = elements.length;
	let i = elements.length;
	while (i--) {
		const e = elements[i];
		if ((e instanceof Runner || e instanceof Chaser) && (e as Role).life <= 0)
			elements.splice(i, 1);
	}
	const erased = elements.length < prevLen;

	const runners = ListUtils.countCharacters(elements, "Runner");
	const chasers = ListUtils.countCharacters(elements, "Chaser");

	board.placeElements(elements);

	// Pass new state to renderer
	renderer.updateLogicState(elements, board);

	if (erased) idleMoves = 0; else idleMoves++;
	turn++;
	updateStats();

	// End conditions
	if (runners === 0 || chasers === 0 || idleMoves >= 50) {
		stopGame();
		showWinner(runners, chasers);
	}
}

function animLoop(time: number) {
	renderer.drawFrame(time);
	animFrameId = requestAnimationFrame(animLoop);
}

function startGame(): void {
	if (logicIntervalId !== null) return;
	paused = false;
	const ms = getSpeedMs();
	renderer.setTurnSpeed(ms);
	logicIntervalId = setInterval(tick, ms);
	btnStart.setAttribute("disabled", "");
	btnPause.removeAttribute("disabled");
}

function pauseGame(): void {
	paused = !paused;
	btnPause.textContent = paused ? "▶ Resume" : "⏸ Pause";
}

function stopGame(): void {
	if (logicIntervalId !== null) { clearInterval(logicIntervalId); logicIntervalId = null; }
	btnStart.removeAttribute("disabled");
	btnPause.setAttribute("disabled", "");
	btnPause.textContent = "⏸ Pause";
	paused = false;
}

function resetGame(): void {
	stopGame();
	initGame();
}

function showWinner(runners: number, chasers: number): void {
	let msg: string;
	if (runners === 0 && chasers === 0) msg = "⚡ It's a Tie!";
	else if (runners === 0) msg = "🔴 Electrons (Chasers) Win!";
	else if (chasers === 0) msg = "🔵 Photons (Runners) Win!";
	else msg = "⏱ Time's up! It's a Draw.";
	overlayMsg.textContent = msg;
	overlay.classList.remove("hidden");
}

function updateStats(): void {
	const runners = ListUtils.countCharacters(elements ?? [], "Runner");
	const chasers = ListUtils.countCharacters(elements ?? [], "Chaser");
	cntRunners.textContent = String(runners);
	cntChasers.textContent = String(chasers);
	cntTurn.textContent = String(turn);
}

// ── Slider labels ─────────────────────────────────────────────────────────────
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
	if (logicIntervalId !== null) {
		stopGame();
		startGame();
	}
});

// ── Speed restart on change ───────────────────────────────────────────────────
btnStart.addEventListener("click", () => { if (!board) initGame(); startGame(); });
btnPause.addEventListener("click", pauseGame);
btnReset.addEventListener("click", resetGame);
document.getElementById("btn-overlay-reset")!.addEventListener("click", resetGame);

// ── Init view ─────────────────────────────────────────────────────────────────
lblRows.textContent = inpRows.value;
lblCols.textContent = inpCols.value;
lblSpeed.textContent = `${inpSpeed.value}x`;
lblRun.textContent = inpRun.value;
lblCha.textContent = inpCha.value;
lblObs.textContent = inpObs.value;
lblHea.textContent = inpHea.value;
lblSpe.textContent = inpSpe.value;

window.addEventListener("resize", () => {
	if (board) {
		renderer.resize(board.rows, board.cols);
		renderer.updateLogicState(elements, board);
	}
});

initGame();
