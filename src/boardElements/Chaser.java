package boardElements;

import java.util.ArrayList;
import utils.Position;

public class Chaser extends Role implements Target {

	private int speed;
	private int speedTurns;
	private Target target;
	Position prevPos;

	public Chaser(int row, int col) {
		super(row, col);
		this.speed = 1;
		this.speedTurns = 0;
		this.target = null;
		this.prevPos = new Position(row, col);
	}

	public int getSpeed() {
		return speed;
	}

	public void setSpeed(int speed) {
		this.speed = speed;
	}

	public int getSpeedTurns() {
		return speedTurns;
	}

	public void setSpeedTurns(int speedTurns) {
		this.speedTurns = speedTurns;
	}

	public Target getTarget() {
		return this.target;
	}

	public void setTarget(ArrayList<BoardElement> gameElements) {
		int minDist = Integer.MAX_VALUE;
		Target target = null;
		for (BoardElement e : gameElements) {
			if (e instanceof Runner) {
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

	public void decrementSpeedTurn() {
		if (speedTurns > 0)
			speedTurns--;
	}
}
