import { Role } from "./Role.js";
import { Target } from "./Target.js";
import { BoardElement } from "./BoardElement.js";
import { Position } from "../utils/Position.js";
import { Chaser } from "./Chaser.js";

export class Runner extends Role implements Target {
	private _target: Target | null = null;
	private _prevPos: Position;

	constructor(row: number, col: number) {
		super(row, col);
		this._prevPos = new Position(row, col);
	}

	getTarget(): Target | null { return this._target; }

	setTarget(elements: BoardElement[]): void {
		let minDist = 5;
		let target: Target | null = null;
		for (const e of elements) {
			if (e instanceof Chaser) {
				const dist = Position.calcDistance(this.pos, e.pos);
				if (dist < minDist) {
					minDist = dist;
					target = e as unknown as Target;
				}
			}
		}
		this._target = target;
	}

	get prevPos(): Position { return this._prevPos; }

	override setPos(row: number, col: number): void {
		this._prevPos = new Position(this.row, this.col);
		super.setPos(row, col);
	}
}
