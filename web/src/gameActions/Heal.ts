import { BoardElement } from "../boardElements/BoardElement.js";
import { Healer } from "../boardElements/Healer.js";
import { Runner } from "../boardElements/Runner.js";
import { MovUtils } from "../utils/MovUtils.js";

export class Heal {
	static healRunners(elements: BoardElement[]): void {
		for (const e of elements) {
			if (e instanceof Healer) {
				for (const other of elements) {
					if (other instanceof Runner && MovUtils.isNeighbour(e.pos, other.pos)) {
						other.sumLife(e.extraLife);
						e.extraLife = 0;
					}
				}
			}
		}
		// remove used healers
		let i = elements.length;
		while (i--) {
			const e = elements[i];
			if (e instanceof Healer && e.extraLife === 0) elements.splice(i, 1);
		}
	}
}
