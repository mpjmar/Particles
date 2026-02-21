package strategies;

import java.util.ArrayList;

import board.Board;
import boardElements.BoardElement;
import utils.Position;

public interface Strategy {
	
	public void move(ArrayList<BoardElement> e, Board b, Character c);
	public Position calcBestPos(ArrayList<BoardElement> e, Board b, Character c);
}
