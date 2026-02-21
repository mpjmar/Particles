package gameActions;

import java.util.ArrayList;

import boardElements.BoardElement;
import boardElements.Chaser;
import boardElements.Runner;
import utils.MovUtils;

public class Fight {

	public static void searchEnemies(ArrayList<BoardElement> elements) {
		for (BoardElement e : elements)
			if (e instanceof Chaser && ((Chaser) e).getTarget() != null && MovUtils.isNeighbour(e.getPos(), ((Chaser) e).getTarget().getPos()))
				fight((Chaser) e, (Runner) (((Chaser) e).getTarget()));
	}
	
	private static void fight(Chaser c, Runner r) {
			int cLife = c.getLife();
			int rLife = r.getLife();
			int cActualLife = c.getLife() - rLife;
			int rActualLife = r.getLife() - cLife;
			c.setLife(cActualLife > 0 ? cActualLife : 0);
			r.setLife(rActualLife > 0 ? rActualLife : 0);
	}
}
