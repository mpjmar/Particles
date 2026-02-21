import { BoardElement } from "../boardElements/BoardElement.js";
import { Board } from "../board/Board.js";
import { Chaser } from "../boardElements/Chaser.js";
import { Runner } from "../boardElements/Runner.js";
import { MovUtils } from "../utils/MovUtils.js";
import { Position } from "../utils/Position.js";
import { generateRandom } from "../utils/Utils.js";

export class ChaserStrategy {
	static calcBestPos(elements: BoardElement[], board: Board, c: Chaser): Position {
		let bestPos: Position | null = null;
		let availPos = MovUtils.generatePos(c.row, c.col);

		const target = c.getTarget();
		if (target !== null) {
			// set distances
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
			let candidate: Position;
			do {
				candidate = MovUtils.randomPos(c.pos);
			} while (!MovUtils.isValid(elements, board, candidate) || !MovUtils.isEmpty(elements, candidate.row, candidate.col));
			bestPos = candidate;
		}
		return bestPos;
	}
}
