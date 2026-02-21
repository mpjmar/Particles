package boardElements;

import utils.Utils;

public abstract class Role extends BoardElement {
	
	private int life;
	private int speed;

	public Role(int row, int col) {
		super(row, col);
		this.life = Utils.generateRandom(10, 20);
		//this.speed = Utils.generateRandom(1, 5);
	}

	public int getLife() {
		return this.life;
	}

	public void setLife(int life) {
		this.life = life;
	}

	public int getSpeed() {
		return this.speed;
	}

	public void setSpeed(int speed) {
		this.speed = speed;
	}

	public void sumLife(int life) {
		this.life += life;
	}
}
