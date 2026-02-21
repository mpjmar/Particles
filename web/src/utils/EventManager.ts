import { Position } from "../utils/Position.js";

// Exporting interfaces so the Renderer can create visual effects
export interface VfxEvent {
	type: "fight" | "death" | "heal" | "speed";
	row: number;
	col: number;
	color?: string;
}

export class EventManager {
	private static events: VfxEvent[] = [];

	static emit(event: VfxEvent) {
		this.events.push(event);
	}

	static consumeAll(): VfxEvent[] {
		const evts = [...this.events];
		this.events.length = 0;
		return evts;
	}
}
