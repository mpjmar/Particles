import { BoardElement } from "../boardElements/BoardElement.js";
import { Board } from "../board/Board.js";
import { Runner } from "../boardElements/Runner.js";
import { MovUtils } from "../utils/MovUtils.js";
import { Position } from "../utils/Position.js";
import { generateRandom } from "../utils/Utils.js";

export class RunnerStrategy {
	static calcBestPos(elements: BoardElement[], board: Board, r: Runner): Position {
		let bestPos: Position | null = null;
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

			// Runner sorts descending (flee)
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
			let candidate: Position;
			do {
				candidate = MovUtils.randomPos(r.pos);
			} while (!MovUtils.isValid(elements, board, candidate) || !MovUtils.isEmpty(elements, candidate.row, candidate.col));
			bestPos = candidate;
		}
		return bestPos;
	}
}
