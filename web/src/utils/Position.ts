export class Position {
  row: number;
  col: number;
  dist: number;

  constructor(row = 0, col = 0) {
    this.row = row;
    this.col = col;
    this.dist = 0;
  }

  setDist(pos: Position): void {
    this.dist = Position.calcDistance(this, pos);
  }

  static calcDistance(p1: Position, p2: Position): number {
    return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col);
  }
}
