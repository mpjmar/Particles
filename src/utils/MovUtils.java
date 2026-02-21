package utils;

import java.util.ArrayList;

import board.Board;
import boardElements.BoardElement;
import boardElements.Chaser;
import boardElements.Obstacle;

public class MovUtils {

	public static boolean isEmpty(ArrayList<BoardElement> gameElements, int row, int col) {
		for (BoardElement e : gameElements)
			if (e.getRow() == row && e.getCol() == col)
				return false;
		return true;
	}

	public static boolean isObstacle(ArrayList<BoardElement> gameElements, int row, int col) {
		for (BoardElement e : gameElements)
			if (e instanceof Obstacle && e.getRow() == row && e.getCol() == col)
				return true;
		return false;
	}

	public static boolean isWithinLimits(Board board, Position pos) {
		return pos.getRow() >= 0 && pos.getRow() < board.getRows() &&
			pos.getCol() >= 0 && pos.getCol() < board.getCols();
	}

	public static boolean isSafe(ArrayList<BoardElement> gameElements, Position pos) {
		for (BoardElement e : gameElements)
			if (e instanceof Chaser && isNeighbour(pos, e.getPos()))
				return false;
		return true;
	}

	public static boolean isNeighbour(Position p1, Position p2) {
		return (Math.abs(p1.getRow() - p2.getRow()) + (Math.abs(p1.getCol() - p2.getCol())) == 1);
	}

	public static boolean isValid(ArrayList<BoardElement> gameElements, Board board, Position pos) {
		return isWithinLimits(board, pos) && !isObstacle(gameElements, pos.getRow(), pos.getCol());
	}

	public static ArrayList<Position> generatePos(int row, int col) {
		ArrayList<Position> positions = new ArrayList<Position>();
		positions.add(new Position(row, col + 1));
		positions.add(new Position(row, col - 1));
		positions.add(new Position(row + 1, col));
		positions.add(new Position(row - 1, col));
		return positions;
	}

	public static Position randomPos(Position pos) {
		int option = (int)(Math.random() * 4) + 1;

		int newRow = pos.getRow();
		int newCol = pos.getCol();

		switch (option) {
			case 1 -> newRow++;
			case 2 -> newRow--;
			case 3 -> newCol++;
			case 4 -> newCol--;
		};
		return new Position(newRow, newCol);
	}

}
