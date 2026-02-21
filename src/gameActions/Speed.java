package gameActions;

import java.util.ArrayList;

import boardElements.BoardElement;
import boardElements.Chaser;
import boardElements.Speeder;
import utils.MovUtils;

public class Speed {
	
	public static void speedChasers(ArrayList<BoardElement> elements) {
		for (BoardElement e : elements) {
			if (e instanceof Speeder s) {
				for (BoardElement other : elements) {
					if (other instanceof Chaser c && MovUtils.isNeighbour(s.getPos(), c.getPos())) {
						giveSpeed(c);
						s.setSpeed(0);
					}
				}
			}
		}
		elements.removeIf(e -> e instanceof Speeder s && s.getSpeed() == 0);
	}
	private static void giveSpeed(Chaser c) {
		c.setSpeedTurns(5);
	}
}
