package board;

import boardElements.*;
import java.util.ArrayList;
import utils.*;

public class Board {

	private int rows;
	private int cols;
	private int[][] board;

	public Board(int rows, int cols) {
		this.rows = rows;
		this.cols = cols;
		board = new int[rows][cols];
	}

	public int getRows() {
		return rows;
	}

	public void setRows(int rows) {
		this.rows = rows;
	}

	public int getCols() {
		return cols;
	}

	public void setCols(int cols) {
		this.cols = cols;
	}

	public int[][] getBoard() {
		return board;
	}

	public int getCell(int row, int col) {
		return board[row][col];
	}

	public void setCell(int row, int col, int value) {
		board[row][col] = value;
	}

	public int getCell(Position pos) {
		return getCell(pos.getRow(), pos.getCol());
	}

	public void setCell(Position pos, int value) {
		setCell(pos.getRow(), pos.getCol(), value);
	}

	@Override
	public String toString() {
		String map = "\n";
		map += displayLines();
		for (int i = 0; i < board.length; i++) {
			for (int j = 0; j < board[i].length; j++) {
				map += "| " + switch (board[i][j]) {
					case 0 -> Utils.displaySymbol(0);
					case 1 -> Utils.displaySymbol(1);
					case 2 -> Utils.displaySymbol(2);
					case 3 -> Utils.displaySymbol(3);
					case 4 -> Utils.displaySymbol(4);
					case 5 -> Utils.displaySymbol(5);
					default -> "";
				};
			}
			map += "|\n" + displayLines();
		}
		return map;
	}

	private String displayLines() {
		String map = "";
		for (int i = 0; i < board[0].length; i++)
			map += " ---";
		map += "\n";
		return map;
	}

	public void clearBoard() {
		for (int i = 0; i < board.length; i++)
			for (int j = 0; j < board[i].length; j++)
				board[i][j] = 0;
	}

	public void placeElements(ArrayList <BoardElement> elements) {
		int value = 0;
		for (BoardElement e : elements) {
			value = switch (e.getClass().getSimpleName()) {
				case "Obstacle" -> 1;
				case "Runner" -> 2;
				case "Chaser" -> 3;
				case "Healer" -> 4;
				case "Speeder" -> 5;
				default -> 0;
			};
			setCell(e.getPos(), value);
		}
	}
}
