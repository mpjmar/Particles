import { Position } from "./Position.js";
import { BoardElement } from "../boardElements/BoardElement.js";
import { Board } from "../board/Board.js";
import { Chaser } from "../boardElements/Chaser.js";
import { Obstacle } from "../boardElements/Obstacle.js";
import { generateRandom } from "./Utils.js";

export class MovUtils {
	static isEmpty(gameElements: BoardElement[], row: number, col: number): boolean {
		return !gameElements.some(e => e.row === row && e.col === col);
	}

	static isObstacle(gameElements: BoardElement[], row: number, col: number): boolean {
		return gameElements.some(e => e instanceof Obstacle && e.row === row && e.col === col);
	}

	static isWithinLimits(board: Board, pos: Position): boolean {
		return pos.row >= 0 && pos.row < board.rows && pos.col >= 0 && pos.col < board.cols;
	}

	static isNeighbour(p1: Position, p2: Position): boolean {
		return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col) === 1;
	}

	static isValid(gameElements: BoardElement[], board: Board, pos: Position): boolean {
		return this.isWithinLimits(board, pos) && !this.isObstacle(gameElements, pos.row, pos.col);
	}

	static generatePos(row: number, col: number): Position[] {
		return [
			new Position(row, col + 1),
			new Position(row, col - 1),
			new Position(row + 1, col),
			new Position(row - 1, col),
		];
	}

	static randomPos(pos: Position): Position {
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
