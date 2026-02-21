package utils;

import boardElements.BoardElement;
import boardElements.Chaser;
import boardElements.Runner;
import input.*;
import java.util.ArrayList;

public class Utils {
	
	public static int generateRandom(int min, int max) {
		return (int)(Math.random() * (max - min)) + min;
	}

	public static int displayMenu() {
		System.out.print("""
				
			========= MENU =========
			1. Start Game
			2. Set difficulty
			3. Game Mechanics
			4. Exit
			========================

			Select an option: """);
			
			int option = Input.readInteger(1, 4);
			return option;
	}

	public static int displaySubmenu() {
		System.out.print("""
				
			===== DIFFICULTY =====
			1. Easy
			2. Medium
			3. Hard
			======================

			Choose a level: """);

		int level = Input.readInteger(1, 3);
		return level;
	}

	public static void gameMechanics() {
		System.out.println("""
				
			=============================== GAME MECHANICS ===============================

			✹ Board
				- The game is played on a rectangular grid.
				- Each cell can be empty or contain one element.

			✹ Characters
				- Runners (●) try to survive and move away from Chasers.
				- Chasers (▲) chase and try to kill Runners.
				- Healers (◆) give extra life to nearby Runners.
				- Speeders (▶) give temporary speed boost to nearby Chasers.
				- Obstacles (█) block movement and line of sight.

			✹ Turn sequence
				1) Each Chaser selects the closest Runner as its target.
				2) Runners move first, trying to maximize the distance to their target.
				3) Chasers move next, trying to minimize the distance to their target.
					- Chasers with a speed bonus move 2 cells per turn.
				4) If a Chaser is adjacent to its Runner target, they fight:
					- Both lose life based on the opponent’s life.
					- Characters with 0 or less life are removed from the board.
				5) Runners adjacent to a Healer receive extra life and the Healer disappears.
				6) Chasers adjacent to a Speeder receive a speed bonus for several turns
				and the Speeder disappears.

			✹ Goal
				- The game ends when all Runners or all Chasers are dead,
				or when the maximum number of turns is reached.
				- The side with more surviving characters wins.
			
			==================================================================================
			""");
	}

	public static String displaySymbol(int value) {
		final String GREEN = "\033[0;32m";
		final String RED = "\033[0;31m";
		final String BLUE = "\033[0;34m";
		final String MAGENTA = "\033[1;35m";
		final String RESET = "\033[0m";

		String symbol = switch(value) {
			case 0 -> "  ";
			case 1 -> "█ ";
			case 2 -> GREEN + "● " + RESET;
			case 3 -> RED + "▲ " + RESET;
			case 4 -> BLUE + "◆ " + RESET;
			case 5 -> MAGENTA + "▶ " + RESET;
			default -> "";
		};
		return symbol;
	}

	public static void clearConsole() {
        System.out.print("\033[H");
        System.out.flush();
	}

	public static void displayWinner(ArrayList<BoardElement> elements) {
		final String CYAN_BOLD_BRIGHT = "\033[1;96m";
		final String PURPLE_BRIGHT = "\033[0;95m";
		final String RESET = "\033[0m";
		int chaser = 0;
		int runner = 0;
		String winner = "";
		
		for (BoardElement e : elements) {
			if (e instanceof Chaser)
				chaser++;
			else if (e instanceof Runner)
				runner++;
		}
		winner = chaser > runner ? "CHASERS WIN!!" : runner > chaser ? "RUNNERS WIN!!" : "IT'S A TIE!!!";
		System.out.printf("""
				%s==========================
				==     %s%s    %s==
				==========================%s
				""", PURPLE_BRIGHT, CYAN_BOLD_BRIGHT, winner, PURPLE_BRIGHT, RESET);
	}
}
