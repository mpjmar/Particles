package input;

public class Input {
	
	public static int readInteger(int min, int max) {
		boolean correct = false;
		int option = -1;

		while (!correct) {
			try {
				option = Integer.parseInt(System.console().readLine());
				correct = option >= min && option <= max;
				if (!correct)
					System.out.println("ERROR: Please, enter a valid option");
			} catch (NumberFormatException e) {
				System.out.println("Invalid number format. Please, enter an integer.");
			}
		}
		return option;
	}
	
}
