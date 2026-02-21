import { BoardElement } from "./BoardElement.js";
import { generateRandom } from "../utils/Utils.js";

export abstract class Role extends BoardElement {
	private _life: number;
	private _speed: number;

	constructor(row: number, col: number) {
		super(row, col);
		this._life = generateRandom(10, 20);
		this._speed = 1;
	}

	get life(): number { return this._life; }
	set life(v: number) { this._life = v; }

	get speed(): number { return this._speed; }
	set speed(v: number) { this._speed = v; }

	sumLife(amount: number): void { this._life += amount; }
}
