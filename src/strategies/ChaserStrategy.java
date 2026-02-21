package strategies;

import java.util.ArrayList;
import java.util.Collections;

import board.Board;
import boardElements.BoardElement;
import boardElements.Chaser;
import utils.*;

public class ChaserStrategy {

	public static Position calcBestPos(ArrayList<BoardElement> gameElements, Board board, Chaser c) {

		Position bestPos = null;
		ArrayList<Position> availPos = MovUtils.generatePos(c.getRow(), c.getCol());
		
		if (c.getTarget() != null) {
			for (Position p : availPos) {
				if (MovUtils.isWithinLimits(board, p) && !MovUtils.isObstacle(gameElements, p.getRow(), p.getCol()))
					p.setDist(c.getTarget().getPos());
			}
			availPos.removeIf(p -> !MovUtils.isWithinLimits(board, p) || MovUtils.isObstacle(gameElements, p.getRow(), p.getCol()));

			Collections.sort(availPos, (p1, p2) -> {
				int compareDist = Integer.compare(p1.getDist(), p2.getDist());
				if (compareDist != 0)
					return compareDist;

				Position prev = c.getPrevPos();
				boolean p1IsPrev = prev != null && p1.getRow() == prev.getRow() && p1.getCol() == prev.getCol();
				boolean p2IsPrev = prev != null && p2.getRow() == prev.getRow() && p2.getCol() == prev.getCol();

				if (p1IsPrev && !p2IsPrev) return 1;
				if (!p1IsPrev && p2IsPrev) return -1;

				return Utils.generateRandom(-1, 1);
			});

			for (Position p : availPos) {
				if (MovUtils.isEmpty(gameElements, p.getRow(), p.getCol())) {
					bestPos = p;
					break;
				}
			}
			if (bestPos == null)
				bestPos = c.getPos();
		}
		else {
			do {
				bestPos = MovUtils.randomPos(c.getPos());
			} while (!(MovUtils.isValid(gameElements, board, bestPos)));
		}
		
		return bestPos;	
	}
}
