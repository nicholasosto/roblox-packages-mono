import { SoundService, TweenService } from "@rbxts/services";
import { Logger } from "@trembus/logger";
import type { MusicTrack, CrossfadeConfig } from "./types";
import { DEFAULT_CROSSFADE_DURATION, DEFAULT_FADE_OUT_DURATION, LOG_TAG } from "./constants";

const logger = Logger.create(LOG_TAG);

export class MusicPlayer {
	private soundA: Sound;
	private soundB: Sound;
	private activeSoundIsA = true;
	private playlist: MusicTrack[] = [];
	private currentIndex = -1;
	private shuffled = false;
	private volumeScale = 1;
	private endedConnection: RBXScriptConnection | undefined;

	constructor() {
		this.soundA = this.createMusicSound("MusicA");
		this.soundB = this.createMusicSound("MusicB");
	}

	setVolumeScale(scale: number): void {
		this.volumeScale = scale;
		const active = this.getActiveSound();
		if (active.IsPlaying) {
			active.Volume = this.getTrackVolume() * this.volumeScale;
		}
	}

	play(track: MusicTrack, crossfade?: CrossfadeConfig): void {
		const incoming = this.getInactiveSound();
		const outgoing = this.getActiveSound();

		incoming.SoundId = track.soundId;
		incoming.Looped = track.looped ?? true;

		const targetVolume = (track.volume ?? 1) * this.volumeScale;
		const duration = crossfade?.duration ?? DEFAULT_CROSSFADE_DURATION;
		const easingStyle = crossfade?.style === "smooth" ? Enum.EasingStyle.Sine : Enum.EasingStyle.Linear;

		if (outgoing.IsPlaying) {
			incoming.Volume = 0;
			incoming.Play();
			this.tween(incoming, targetVolume, duration, easingStyle);
			this.tween(outgoing, 0, duration, easingStyle);
			task.delay(duration, () => outgoing.Stop());
		} else {
			incoming.Volume = targetVolume;
			incoming.Play();
		}

		this.activeSoundIsA = !this.activeSoundIsA;
		this.connectEnded();

		logger.info(`Playing: ${track.name ?? track.soundId}`);
	}

	stop(fadeOut?: number): void {
		this.disconnectEnded();
		const active = this.getActiveSound();
		if (!active.IsPlaying) return;

		const duration = fadeOut ?? DEFAULT_FADE_OUT_DURATION;
		if (duration > 0) {
			this.tween(active, 0, duration, Enum.EasingStyle.Linear);
			task.delay(duration, () => active.Stop());
		} else {
			active.Stop();
		}
	}

	pause(): void {
		const active = this.getActiveSound();
		if (active.IsPlaying) {
			active.Pause();
		}
	}

	resume(): void {
		const active = this.getActiveSound();
		if (active.IsPaused) {
			active.Resume();
		}
	}

	setPlaylist(tracks: MusicTrack[], shuffle?: boolean): void {
		this.playlist = [...tracks];
		this.shuffled = shuffle ?? false;
		this.currentIndex = -1;

		if (this.shuffled) {
			this.shufflePlaylist();
		}
	}

	next(crossfade?: CrossfadeConfig): void {
		if (this.playlist.size() === 0) {
			logger.warn("No playlist set");
			return;
		}

		this.currentIndex = (this.currentIndex + 1) % this.playlist.size();
		const track = this.playlist[this.currentIndex];
		this.play(track, crossfade);
	}

	isPlaying(): boolean {
		return this.getActiveSound().IsPlaying;
	}

	destroy(): void {
		this.disconnectEnded();
		this.soundA.Stop();
		this.soundB.Stop();
		this.soundA.Destroy();
		this.soundB.Destroy();
	}

	private createMusicSound(soundName: string): Sound {
		const sound = new Instance("Sound");
		sound.Name = soundName;
		sound.Parent = SoundService;
		return sound;
	}

	private getActiveSound(): Sound {
		return this.activeSoundIsA ? this.soundA : this.soundB;
	}

	private getInactiveSound(): Sound {
		return this.activeSoundIsA ? this.soundB : this.soundA;
	}

	private getTrackVolume(): number {
		if (this.currentIndex >= 0 && this.currentIndex < this.playlist.size()) {
			return this.playlist[this.currentIndex].volume ?? 1;
		}
		return 1;
	}

	private tween(sound: Sound, targetVolume: number, duration: number, easingStyle: Enum.EasingStyle): void {
		const tweenInfo = new TweenInfo(duration, easingStyle, Enum.EasingDirection.InOut);
		const tween = TweenService.Create(sound, tweenInfo, { Volume: targetVolume });
		tween.Play();
	}

	private connectEnded(): void {
		this.disconnectEnded();
		const active = this.getActiveSound();
		this.endedConnection = active.Ended.Connect(() => {
			if (this.playlist.size() > 0 && !active.Looped) {
				this.next();
			}
		});
	}

	private disconnectEnded(): void {
		if (this.endedConnection) {
			this.endedConnection.Disconnect();
			this.endedConnection = undefined;
		}
	}

	private shufflePlaylist(): void {
		const rng = new Random();
		for (let i = this.playlist.size() - 1; i > 0; i--) {
			const j = rng.NextInteger(0, i);
			const temp = this.playlist[i];
			this.playlist[i] = this.playlist[j];
			this.playlist[j] = temp;
		}
	}
}
