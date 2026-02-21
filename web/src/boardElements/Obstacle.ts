import { BoardElement } from "./BoardElement.js";

export class Obstacle extends BoardElement {
	constructor(row: number, col: number) {
		super(row, col);
	}
}
