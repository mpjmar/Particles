import { Board } from "../board/Board.js";
import { BoardElement } from "../boardElements/BoardElement.js";
import { Obstacle } from "../boardElements/Obstacle.js";
import { Runner } from "../boardElements/Runner.js";
import { Chaser } from "../boardElements/Chaser.js";
import { Healer } from "../boardElements/Healer.js";
import { Speeder } from "../boardElements/Speeder.js";
import { ListUtils } from "../utils/ListUtils.js";
import { generateRandom } from "../utils/Utils.js";

type SpawnFn = (row: number, col: number) => BoardElement;

function spawnN(board: Board, elements: BoardElement[], count: number, fn: SpawnFn): void {
	for (let i = 0; i < count; i++) {
		let row: number, col: number;
		do {
			row = generateRandom(0, board.rows);
			col = generateRandom(0, board.cols);
		} while (!ListUtils.isEmpty(elements, row, col));
		elements.push(fn(row, col));
	}
}

export class ElementsGenerator {
	static generateElements(board: Board, counts: { runners: number, chasers: number, obstacles: number, healers: number, speeders: number }, elements: BoardElement[]): void {
		spawnN(board, elements, counts.obstacles, (r, c) => new Obstacle(r, c));
		spawnN(board, elements, counts.chasers, (r, c) => new Chaser(r, c));
		spawnN(board, elements, counts.runners, (r, c) => new Runner(r, c));
		spawnN(board, elements, counts.healers, (r, c) => new Healer(r, c, generateRandom(10, 50)));
		spawnN(board, elements, counts.speeders, (r, c) => new Speeder(r, c));
	}
}
