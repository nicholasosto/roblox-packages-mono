import { SoundService } from "@rbxts/services";
import { Logger } from "@trembus/logger";
import type { SoundConfig } from "./types";
import { SoundPool } from "./sound-pool";
import { LOG_TAG } from "./constants";

const logger = Logger.create(LOG_TAG);

export class SfxPlayer {
	private pools = new Map<string, SoundPool>();
	private spatialSounds: Sound[] = [];
	private volumeScale = 1;

	setVolumeScale(scale: number): void {
		this.volumeScale = scale;
	}

	play(config: SoundConfig): Sound | undefined {
		const pool = this.getOrCreatePool(config.soundId);
		const sound = pool.acquire();
		if (!sound) return undefined;

		this.configureSound(sound, config);
		sound.Play();
		return sound;
	}

	playAtPosition(config: SoundConfig, position: Vector3, parent?: Instance): Sound | undefined {
		const sound = new Instance("Sound");
		sound.SoundId = config.soundId;
		this.configureSound(sound, config);

		const attachment = new Instance("Attachment");
		attachment.WorldPosition = position;

		if (parent) {
			attachment.Parent = parent;
		} else {
			const part = new Instance("Part");
			part.Anchored = true;
			part.CanCollide = false;
			part.Transparency = 1;
			part.Size = new Vector3(0.1, 0.1, 0.1);
			part.Position = position;
			part.Parent = SoundService;
			attachment.Parent = part;

			sound.Ended.Once(() => {
				part.Destroy();
			});
		}

		sound.Parent = attachment;
		this.spatialSounds.push(sound);

		sound.Ended.Once(() => {
			const idx = this.spatialSounds.indexOf(sound);
			if (idx !== -1) {
				this.spatialSounds.remove(idx);
			}
			sound.Destroy();
		});

		sound.Play();
		return sound;
	}

	stopAll(): void {
		for (const [, pool] of this.pools) {
			pool.stopAll();
		}
		for (const sound of this.spatialSounds) {
			sound.Stop();
			sound.Destroy();
		}
		this.spatialSounds = [];
	}

	destroy(): void {
		this.stopAll();
		for (const [, pool] of this.pools) {
			pool.destroy();
		}
		this.pools.clear();
	}

	private getOrCreatePool(soundId: string): SoundPool {
		let pool = this.pools.get(soundId);
		if (!pool) {
			pool = new SoundPool(soundId);
			this.pools.set(soundId, pool);
		}
		return pool;
	}

	private configureSound(sound: Sound, config: SoundConfig): void {
		sound.Volume = (config.volume ?? 1) * this.volumeScale;
		sound.Looped = config.looped ?? false;
		sound.PlaybackSpeed = config.pitch ?? 1;
	}
}
