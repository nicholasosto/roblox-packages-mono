import { SoundService } from "@rbxts/services";
import { Logger } from "@trembus/logger";
import { DEFAULT_POOL_SIZE, MAX_POOL_SIZE, LOG_TAG } from "./constants";

const logger = Logger.create(LOG_TAG);

export class SoundPool {
	private pool: Sound[] = [];
	private readonly maxSize: number;
	private readonly soundId: string;
	private readonly parent: Instance;

	constructor(soundId: string, maxSize?: number, parent?: Instance) {
		this.soundId = soundId;
		this.maxSize = math.clamp(maxSize ?? DEFAULT_POOL_SIZE, 1, MAX_POOL_SIZE);
		this.parent = parent ?? SoundService;
	}

	acquire(): Sound | undefined {
		for (const sound of this.pool) {
			if (!sound.IsPlaying) {
				return sound;
			}
		}

		if (this.pool.size() >= this.maxSize) {
			logger.warn(`Pool exhausted for ${this.soundId} (max ${this.maxSize})`);
			return undefined;
		}

		const sound = new Instance("Sound");
		sound.SoundId = this.soundId;
		sound.Parent = this.parent;
		this.pool.push(sound);
		return sound;
	}

	stopAll(): void {
		for (const sound of this.pool) {
			sound.Stop();
		}
	}

	destroy(): void {
		for (const sound of this.pool) {
			sound.Stop();
			sound.Destroy();
		}
		this.pool = [];
	}
}
