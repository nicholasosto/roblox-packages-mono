import { Logger } from "@trembus/logger";
import type { AudioCategory, SoundConfig, MusicTrack, CrossfadeConfig } from "./types";
import { SfxPlayer } from "./sfx-player";
import { MusicPlayer } from "./music-player";
import {
	DEFAULT_MASTER_VOLUME,
	DEFAULT_CATEGORY_VOLUMES,
	LOG_TAG,
} from "./constants";

const logger = Logger.create(LOG_TAG);

export class AudioManager {
	private masterVolume = DEFAULT_MASTER_VOLUME;
	private categoryVolumes: Map<AudioCategory, number>;
	private muted = false;
	private preMuteVolume = DEFAULT_MASTER_VOLUME;

	private sfxPlayer = new SfxPlayer();
	private musicPlayer = new MusicPlayer();

	constructor() {
		this.categoryVolumes = new Map<AudioCategory, number>();
		DEFAULT_CATEGORY_VOLUMES.forEach((vol, cat) => {
			this.categoryVolumes.set(cat, vol);
		});
		this.applyVolumes();
		logger.info("AudioManager initialized");
	}

	// --- Volume Control ---

	setMasterVolume(volume: number): void {
		this.masterVolume = math.clamp(volume, 0, 1);
		this.applyVolumes();
	}

	getMasterVolume(): number {
		return this.masterVolume;
	}

	setCategoryVolume(category: AudioCategory, volume: number): void {
		this.categoryVolumes.set(category, math.clamp(volume, 0, 1));
		this.applyVolumes();
	}

	getCategoryVolume(category: AudioCategory): number {
		return this.categoryVolumes.get(category) ?? 1;
	}

	mute(): void {
		if (!this.muted) {
			this.preMuteVolume = this.masterVolume;
			this.muted = true;
			this.applyVolumes();
		}
	}

	unmute(): void {
		if (this.muted) {
			this.muted = false;
			this.masterVolume = this.preMuteVolume;
			this.applyVolumes();
		}
	}

	toggleMute(): void {
		if (this.muted) {
			this.unmute();
		} else {
			this.mute();
		}
	}

	isMuted(): boolean {
		return this.muted;
	}

	// --- SFX ---

	playSfx(config: SoundConfig): Sound | undefined {
		return this.sfxPlayer.play(config);
	}

	playSfxAtPosition(config: SoundConfig, position: Vector3, parent?: Instance): Sound | undefined {
		return this.sfxPlayer.playAtPosition(config, position, parent);
	}

	stopAllSfx(): void {
		this.sfxPlayer.stopAll();
	}

	// --- Music ---

	playMusic(track: MusicTrack, crossfade?: CrossfadeConfig): void {
		this.musicPlayer.play(track, crossfade);
	}

	stopMusic(fadeOut?: number): void {
		this.musicPlayer.stop(fadeOut);
	}

	pauseMusic(): void {
		this.musicPlayer.pause();
	}

	resumeMusic(): void {
		this.musicPlayer.resume();
	}

	setPlaylist(tracks: MusicTrack[], shuffle?: boolean): void {
		this.musicPlayer.setPlaylist(tracks, shuffle);
	}

	nextTrack(crossfade?: CrossfadeConfig): void {
		this.musicPlayer.next(crossfade);
	}

	isMusicPlaying(): boolean {
		return this.musicPlayer.isPlaying();
	}

	// --- Lifecycle ---

	destroy(): void {
		this.sfxPlayer.destroy();
		this.musicPlayer.destroy();
		logger.info("AudioManager destroyed");
	}

	// --- Private ---

	private applyVolumes(): void {
		const effectiveMaster = this.muted ? 0 : this.masterVolume;

		const sfxScale = effectiveMaster * (this.categoryVolumes.get("sfx") ?? 1);
		const musicScale = effectiveMaster * (this.categoryVolumes.get("music") ?? 1);

		this.sfxPlayer.setVolumeScale(sfxScale);
		this.musicPlayer.setVolumeScale(musicScale);
	}
}
