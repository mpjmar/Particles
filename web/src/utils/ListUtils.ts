import { BoardElement } from "../boardElements/BoardElement.js";
import { Chaser } from "../boardElements/Chaser.js";
import { Runner } from "../boardElements/Runner.js";
import { Role } from "../boardElements/Role.js";

export class ListUtils {
	static isEmpty(gameElements: BoardElement[], row: number, col: number): boolean {
		return !gameElements.some(e => e.row === row && e.col === col);
	}

	static countCharacters(gameElements: BoardElement[], character: string): number {
		return gameElements.filter(e => {
			if (character === "Chaser") return e instanceof Chaser;
			if (character === "Runner") return e instanceof Runner;
			return false;
		}).length;
	}
}
