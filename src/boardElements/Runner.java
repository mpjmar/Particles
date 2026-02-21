package boardElements;

import java.util.ArrayList;
import utils.Position;

public class Runner extends Role implements Target {

	private Target target;
	private Position prevPos;

	public Runner(int row, int col) {
		super(row, col);
		this.target = null;
		this.prevPos = new Position(row, col);
	}

	public Target getTarget() {
		return this.target;
	}

	@Override
	public void setTarget(ArrayList<BoardElement> gameElements) {
		int minDist = 5;
		Target target = null;
		for (BoardElement e : gameElements) {
			if (e instanceof Chaser) {
				int dist = Position.calcDistance(this.getPos(), e.getPos());
				if (dist < minDist) {
					minDist = dist;
					target = (Target) e;
				}
			}
		}
		this.target = target;
	}

	public Position getPrevPos() {
		return prevPos;
	}

	@Override
	public void setPos(int row, int col) {
		this.prevPos = new Position(getRow(), getCol());
		super.setPos(row, col);
	}

	@Override
	public void setPos(Position pos) {
		this.prevPos = new Position(getRow(), getCol());
		super.setPos(pos);
	}
}
