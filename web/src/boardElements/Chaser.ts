import { Role } from "./Role.js";
import { Target } from "./Target.js";
import { BoardElement } from "./BoardElement.js";
import { Position } from "../utils/Position.js";
import { Runner } from "./Runner.js";

export class Chaser extends Role implements Target {
	private _speed: number;
	private _speedTurns: number;
	private _target: Target | null;
	private _prevPos: Position;

	constructor(row: number, col: number) {
		super(row, col);
		this._speed = 1;
		this._speedTurns = 0;
		this._target = null;
		this._prevPos = new Position(row, col);
	}

	get chaserSpeed(): number { return this._speed; }
	set chaserSpeed(v: number) { this._speed = v; }

	get speedTurns(): number { return this._speedTurns; }
	set speedTurns(v: number) { this._speedTurns = v; }

	getTarget(): Target | null { return this._target; }

	setTarget(elements: BoardElement[]): void {
		let minDist = Number.MAX_SAFE_INTEGER;
		let target: Target | null = null;
		for (const e of elements) {
			if (e instanceof Runner) {
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

	decrementSpeedTurn(): void {
		if (this._speedTurns > 0) this._speedTurns--;
	}
}
