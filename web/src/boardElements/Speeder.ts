import { BoardElement } from "./BoardElement.js";

export class Speeder extends BoardElement {
	private _speed: number;

	constructor(row: number, col: number) {
		super(row, col);
		this._speed = 2;
	}

	get speed(): number { return this._speed; }
	set speed(v: number) { this._speed = v; }
}
