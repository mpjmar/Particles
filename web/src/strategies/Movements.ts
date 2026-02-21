import { BoardElement } from "../boardElements/BoardElement.js";
import { Board } from "../board/Board.js";
import { Runner } from "../boardElements/Runner.js";
import { Chaser } from "../boardElements/Chaser.js";
import { ChaserStrategy } from "./ChaserStrategy.js";
import { RunnerStrategy } from "./RunnerStrategy.js";

export class Movements {
	static move(elements: BoardElement[], board: Board): void {
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
