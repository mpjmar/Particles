package generator;

import java.util.ArrayList;

import board.Board;
import boardElements.*;
import utils.ListUtils;
import utils.Utils;

public class ElementsGenerator {
	
		public static void generateObstacles(Board board, int level, ArrayList<BoardElement> gameElements) {
		int row;
		int col;
		int totalCells = board.getRows() * board.getCols();

		int maxElements = level == 1 ? totalCells / 20 : level == 2 ? totalCells / 15 : totalCells / 10;
		int elements = Utils.generateRandom(maxElements / 2, maxElements);
		
		for (int i = 0; i < elements; i++) {
			do {
				row = Utils.generateRandom(0, board.getRows());
				col = Utils.generateRandom(0, board.getCols());
			} while (!ListUtils.isEmpty(gameElements, row, col));
			Obstacle obstacle = new Obstacle(row, col);
			gameElements.add(obstacle);
		}
	}

	public static void generateRunners(Board board, int level, ArrayList<BoardElement> gameElements) {
		int row;
		int col;
		int totalCells = board.getRows() * board.getCols();

		int maxElements = level == 1 ? totalCells / 20 : level == 2 ? totalCells / 15 : totalCells / 10;
		int elements = Utils.generateRandom(maxElements / 2, maxElements);
		
		for (int i = 0; i < elements; i++) {
			do {
				row = Utils.generateRandom(0, board.getRows());
				col = Utils.generateRandom(0, board.getCols());
			} while (!ListUtils.isEmpty(gameElements, row, col));
			Runner runner = new Runner(row, col);
			gameElements.add(runner);
		}
	}

	public static void generateChasers(Board board, int level, ArrayList<BoardElement> gameElements) {
		int row;
		int col;
		int totalCells = board.getRows() * board.getCols();

		int maxElements = level == 1 ? totalCells / 20 : level == 2 ? totalCells / 15 : totalCells / 10;
		int elements = Utils.generateRandom(maxElements / 2, maxElements);
		
		for (int i = 0; i < elements; i++) {
			do {
				row = Utils.generateRandom(0, board.getRows());
				col = Utils.generateRandom(0, board.getCols());
			} while (!ListUtils.isEmpty(gameElements, row, col));
			Chaser chaser = new Chaser(row, col);
			gameElements.add(chaser);
		}
	}

	public static void generateHealers(Board board, int level, ArrayList<BoardElement> gameElements) {
		int row;
		int col;
		int totalCells = board.getRows() * board.getCols();

		int maxElements = level == 1 ? totalCells / 20 : level == 2 ? totalCells / 30 : totalCells / 40;
		int elements = Utils.generateRandom(maxElements / 2, maxElements);
		
		for (int i = 0; i < elements; i++) {
			do {
				row = Utils.generateRandom(0, board.getRows());
				col = Utils.generateRandom(0, board.getCols());
			} while (!ListUtils.isEmpty(gameElements, row, col));
			int amount = Utils.generateRandom(10, 50);
			Healer healer = new Healer(row, col, amount);
			gameElements.add(healer);
		}
	}

	public static void generateSpeeders(Board board, int level, ArrayList<BoardElement> gameElements) {
		int row;
		int col;
		int totalCells = board.getRows() * board.getCols();

		int maxElements = level == 1 ? totalCells / 20 : level == 2 ? totalCells / 30 : totalCells / 40;
		int elements = Utils.generateRandom(maxElements / 2, maxElements);
		
		for (int i = 0; i < elements; i++) {
			do {
				row = Utils.generateRandom(0, board.getRows());
				col = Utils.generateRandom(0, board.getCols());
			} while (!ListUtils.isEmpty(gameElements, row, col));
			Speeder speeder = new Speeder(row, col);
			gameElements.add(speeder);
		}
	}

	public static void generateElements(Board board, int level, ArrayList<BoardElement> gameElements) {
		ElementsGenerator.generateObstacles(board, level, gameElements);
		ElementsGenerator.generateChasers(board, level, gameElements);
		ElementsGenerator.generateRunners(board, level, gameElements);
		ElementsGenerator.generateHealers(board, level, gameElements);
		ElementsGenerator.generateSpeeders(board, level, gameElements);
	}
}
