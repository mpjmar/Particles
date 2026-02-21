package strategies;

import java.util.ArrayList;
import board.Board;
import boardElements.*;
import utils.Position;

public class Movements {

	public static void move(ArrayList<BoardElement> gameElements, Board board) {
		for (BoardElement e : gameElements) {
			if (e instanceof Runner r) {
				Position bestPos = RunnerStrategy.calcBestPos(gameElements, board, r);
				r.setPos(bestPos.getRow(), bestPos.getCol());
			}
			else if (e instanceof Chaser c) {
				int steps = c.getSpeedTurns() > 0 ? 2 : 1;

				for (int i = 0; i < steps; i++) {
					Position bestPos = ChaserStrategy.calcBestPos(gameElements, board, c);
					c.setPos(bestPos.getRow(), bestPos.getCol());
					c.decrementSpeedTurn();
				}
			}
		}
	}
}
