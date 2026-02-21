import { BoardElement } from "../boardElements/BoardElement.js";

export class Board {
	rows: number;
	cols: number;
	private _grid: number[][];

	constructor(rows: number, cols: number) {
		this.rows = rows;
		this.cols = cols;
		this._grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
	}

	getGrid(): number[][] { return this._grid; }

	getCell(row: number, col: number): number { return this._grid[row][col]; }
	setCell(row: number, col: number, value: number): void { this._grid[row][col] = value; }

	clearBoard(): void {
		for (let i = 0; i < this.rows; i++)
			for (let j = 0; j < this.cols; j++)
				this._grid[i][j] = 0;
	}

	placeElements(elements: BoardElement[]): void {
		this.clearBoard();
		for (const e of elements) {
			const name = e.constructor.name;
			const value =
				name === "Obstacle" ? 1 :
					name === "Runner" ? 2 :
						name === "Chaser" ? 3 :
							name === "Healer" ? 4 :
								name === "Speeder" ? 5 : 0;
			this.setCell(e.row, e.col, value);
		}
	}
}
