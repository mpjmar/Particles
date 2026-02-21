import { BoardElement } from "./BoardElement.js";

export class Healer extends BoardElement {
	private _extraLife: number;

	constructor(row: number, col: number, life: number) {
		super(row, col);
		this._extraLife = life;
	}

	get extraLife(): number { return this._extraLife; }
	set extraLife(v: number) { this._extraLife = v; }
}
