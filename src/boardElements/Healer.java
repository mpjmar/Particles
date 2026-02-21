package boardElements;

public class Healer extends BoardElement {
	
	private int extraLife;

	public Healer(int row, int col, int life) {
		super(row, col);
		this.extraLife = life;
	}
	
	public int getExtraLife() {
		return extraLife;
	}

	public void setExtraLife(int life) {
		this.extraLife = life;
	}
}
