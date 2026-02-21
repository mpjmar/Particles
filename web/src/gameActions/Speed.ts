import { BoardElement } from "../boardElements/BoardElement.js";
import { Speeder } from "../boardElements/Speeder.js";
import { Chaser } from "../boardElements/Chaser.js";
import { MovUtils } from "../utils/MovUtils.js";

export class Speed {
	static speedChasers(elements: BoardElement[]): void {
		for (const e of elements) {
			if (e instanceof Speeder) {
				for (const other of elements) {
					if (other instanceof Chaser && MovUtils.isNeighbour(e.pos, other.pos)) {
						other.speedTurns = 5;
						e.speed = 0;
					}
				}
			}
		}
		let i = elements.length;
		while (i--) {
			const e = elements[i];
			if (e instanceof Speeder && e.speed === 0) elements.splice(i, 1);
		}
	}
}
