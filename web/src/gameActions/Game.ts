import { BoardElement } from "../boardElements/BoardElement.js";
import { Board } from "../board/Board.js";
import { Movements } from "../strategies/Movements.js";
import { Fight } from "./Fight.js";
import { Heal } from "./Heal.js";
import { Speed } from "./Speed.js";

export class Game {
	static playGame(elements: BoardElement[], board: Board): void {
		Movements.move(elements, board);
		Fight.searchEnemies(elements);
		Heal.healRunners(elements);
		Speed.speedChasers(elements);
	}
}
