package utils;

public class Position {
	
	private int row;
	private int col;
	private int dist;

	public Position() {
		this.row = 0;
		this.col = 0;
		this.dist = 0;
	}

	public Position(int row, int col) {
		this.row = row;
		this.col = col;
		this.dist = 0;
	}

	public int getRow() {
		return this.row;
	}

	public void setRow(int row) {
		this.row = row;
	}

	public int getCol() {
		return this.col;
	}

	public void setCol(int col) {
		this.col = col;
	}

	public int getDist() {
		return this.dist;
	}

	public void setDist(Position pos) {
		this.dist = calcDistance(this, pos);
	}

	@Override
	public String toString() {
		return "Position: row " + this.row + "| col " + this.col + "\n";
	}

	public static int calcDistance(Position p1, Position p2) {
		return Math.abs(p1.getRow() - p2.getRow()) + Math.abs(p1.getCol() - p2.getCol());
	}

}
