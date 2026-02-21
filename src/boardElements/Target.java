package boardElements;

import java.util.ArrayList;

import utils.Position;

public interface Target {
	void setTarget(ArrayList<BoardElement> e);
	Target getTarget();
	Position getPos();
}
