import { BoardElement } from "../boardElements/BoardElement.js";
import { Chaser } from "../boardElements/Chaser.js";
import { Runner } from "../boardElements/Runner.js";
import { MovUtils } from "../utils/MovUtils.js";

import { EventManager } from "../utils/EventManager.js";

export class Fight {
	static searchEnemies(elements: BoardElement[]): void {
		for (const e of elements) {
			if (e instanceof Chaser) {
				const target = e.getTarget();
				if (target !== null && MovUtils.isNeighbour(e.pos, target.pos)) {
					Fight.fight(e, target as unknown as Runner);
				}
			}
		}
	}

	private static fight(c: Chaser, r: Runner): void {
		const cLife = c.life;
		const rLife = r.life;

		c.life = Math.max(0, cLife - rLife);
		r.life = Math.max(0, rLife - cLife);

		// Emit battle/death events for the renderer
		if (c.life <= 0) EventManager.emit({ type: "death", row: c.row, col: c.col, color: "#ef4444" });
		else EventManager.emit({ type: "fight", row: c.row, col: c.col, color: "#ef4444" });

		if (r.life <= 0) EventManager.emit({ type: "death", row: r.row, col: r.col, color: "#3b82f6" });
		else EventManager.emit({ type: "fight", row: r.row, col: r.col, color: "#3b82f6" });
	}
}
