package boardElements;

public class Speeder extends BoardElement {

	private int speed;

	public Speeder(int row, int col) {
		super(row, col);
		this.speed = 2;
	}

	public int getSpeed() {
		return speed;
	}

	public void setSpeed(int speed) {
		this.speed = speed;
	}
}
