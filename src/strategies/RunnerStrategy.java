package strategies;

import java.util.ArrayList;
import java.util.Collections;

import board.Board;
import boardElements.BoardElement;
import boardElements.Runner;
import utils.*;


public class RunnerStrategy {

	public static Position calcBestPos(ArrayList<BoardElement> gameElements, Board board, Runner r) {

		Position bestPos = null;
		ArrayList<Position> availPos = MovUtils.generatePos(r.getRow(), r.getCol());
		
		if (r.getTarget() != null) {
			for (Position p : availPos) {
				if (MovUtils.isWithinLimits(board, p) && !MovUtils.isObstacle(gameElements, p.getRow(), p.getCol()))
					p.setDist(r.getTarget().getPos());
			}
			availPos.removeIf(p -> !MovUtils.isWithinLimits(board, p) || MovUtils.isObstacle(gameElements, p.getRow(), p.getCol()));
			
			Collections.sort(availPos, (p1, p2) -> {
				int compareDist = Integer.compare(p2.getDist(), p1.getDist());
				if (compareDist != 0)
					return compareDist;

				Position prev = r.getPrevPos();
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
				bestPos = r.getPos();
		}
		else {
			do {
				bestPos = MovUtils.randomPos(r.getPos());
			} while (!(MovUtils.isValid(gameElements, board, bestPos)));
		}
		return bestPos;	
	}
}