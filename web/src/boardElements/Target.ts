import { Position } from "../utils/Position.js";
import { BoardElement } from "./BoardElement.js";

export interface Target {
	setTarget(elements: BoardElement[]): void;
	getTarget(): Target | null;
	get pos(): Position;
}
