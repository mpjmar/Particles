package boardElements;

import java.util.ArrayList;

import board.Board;
import utils.ListUtils;
import utils.Utils;

public class Obstacle extends BoardElement {
	
	public Obstacle() {
		super(0, 0);
	}

	public Obstacle(int row, int col) {
		super(row, col);
	}
}
