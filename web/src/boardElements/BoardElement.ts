import { Position } from "../utils/Position.js";

export abstract class BoardElement {
	private _pos: Position;

	constructor(row = 0, col = 0) {
		this._pos = new Position(row, col);
	}

	get pos(): Position { return this._pos; }
	set pos(p: Position) { this._pos = p; }

	get row(): number { return this._pos.row; }
	get col(): number { return this._pos.col; }

	setPos(row: number, col: number): void {
		this._pos.row = row;
		this._pos.col = col;
	}
}
