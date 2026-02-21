package gameActions;

import java.util.ArrayList;

import boardElements.BoardElement;

import boardElements.Healer;
import boardElements.Runner;
import utils.MovUtils;

public class Heal {
	
	public static void healRunners(ArrayList<BoardElement> elements) {
		for (BoardElement e : elements) {
			if (e instanceof Healer h) {
				for (BoardElement other : elements) {
					if (other instanceof Runner r && MovUtils.isNeighbour(h.getPos(), r.getPos())) {
						heal(h, r);
						h.setExtraLife(0);
					}
				}
			} 
		}
		elements.removeIf(e -> e instanceof Healer h && h.getExtraLife() == 0);
	}
	
	private static void heal(Healer h, Runner r) {
		r.setLife(r.getLife() + h.getExtraLife());
	}
}
