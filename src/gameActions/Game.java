package gameActions;

import java.util.ArrayList;

import board.Board;
import boardElements.BoardElement;
import strategies.Movements;

public class Game {
	
	public static void playGame(ArrayList<BoardElement> gameElements, Board board) {
		Movements.move(gameElements, board);
		Fight.searchEnemies(gameElements);
		Heal.healRunners(gameElements);
		Speed.speedChasers(gameElements);
	}
}
