import { Logger } from "@trembus/logger";
import { CameraUtils } from "../CameraUtils";
import type { CinematicKeyframe, CinematicStateContext, ICameraState } from "../interfaces";

const logger = Logger.create("camera:CinematicState");

/**
 * Cinematic camera state.
 * Plays through a sequence of keyframes for scripted camera movements.
 * Great for cutscenes, intros, and dramatic moments.
 */
export class CinematicState implements ICameraState {
	public readonly name = "cinematic";

	private keyframes: CinematicKeyframe[] = [];
	private currentTime: number = 0;
	private isPlaying: boolean = false;
	private loop: boolean = false;
	private onComplete?: () => void;
	private totalDuration: number = 0;
	private currentCFrame: CFrame = new CFrame();

	public enter(camera: Camera, context?: unknown): void {
		const ctx = context as CinematicStateContext | undefined;

		if (!ctx?.keyframes || ctx.keyframes.size() === 0) {
			logger.warn("CinematicState entered without keyframes");
			return;
		}

		this.keyframes = ctx.keyframes;
		this.loop = ctx.loop ?? false;
		this.onComplete = ctx.onComplete;
		this.currentTime = 0;
		this.isPlaying = true;

		// Calculate total duration
		this.totalDuration = 0;
		for (const keyframe of this.keyframes) {
			if (keyframe.time > this.totalDuration) {
				this.totalDuration = keyframe.time;
			}
		}

		// Initialize to first keyframe
		if (this.keyframes.size() > 0) {
			this.currentCFrame = this.keyframes[0].cframe;
		}

		camera.CameraType = Enum.CameraType.Scriptable;

		logger.info(`Playing cinematic: ${this.keyframes.size()} keyframes, ${this.totalDuration}s duration`);
	}

	public exit(_camera: Camera): void {
		this.isPlaying = false;
		this.keyframes = [];
		this.onComplete = undefined;
		logger.debug("Exiting CinematicState");
	}

	public update(_camera: Camera, dt: number): CFrame {
		if (!this.isPlaying || this.keyframes.size() === 0) {
			return this.currentCFrame;
		}

		// Advance time
		this.currentTime += dt;

		// Check for completion
		if (this.currentTime >= this.totalDuration) {
			if (this.loop) {
				this.currentTime = 0;
				logger.debug("Cinematic looping");
			} else {
				this.isPlaying = false;
				this.currentCFrame = this.keyframes[this.keyframes.size() - 1].cframe;

				// Fire completion callback
				if (this.onComplete) {
					// Defer callback to next frame to avoid issues
					task.defer(() => {
						this.onComplete?.();
					});
				}

				logger.info("Cinematic complete");
				return this.currentCFrame;
			}
		}

		// Evaluate keyframes at current time
		this.currentCFrame = CameraUtils.evaluateKeyframes(this.keyframes, this.currentTime);

		return this.currentCFrame;
	}

	/**
	 * Prevent transition during cinematic unless explicitly allowed
	 */
	public canTransitionTo(nextState: string): boolean {
		// Allow transition to any state if cinematic is complete
		if (!this.isPlaying) {
			return true;
		}

		// During playback, only allow transition to fixed (for skipping)
		return nextState === "fixed";
	}

	/**
	 * Pause the cinematic
	 */
	public pause(): void {
		this.isPlaying = false;
		logger.debug("Cinematic paused");
	}

	/**
	 * Resume the cinematic
	 */
	public resume(): void {
		this.isPlaying = true;
		logger.debug("Cinematic resumed");
	}

	/**
	 * Skip to end of cinematic
	 */
	public skip(): void {
		this.currentTime = this.totalDuration;
		logger.info("Cinematic skipped");
	}

	/**
	 * Get current playback progress (0-1)
	 */
	public getProgress(): number {
		if (this.totalDuration === 0) return 0;
		return this.currentTime / this.totalDuration;
	}

	/**
	 * Check if cinematic is currently playing
	 */
	public isCurrentlyPlaying(): boolean {
		return this.isPlaying;
	}

	/**
	 * Seek to a specific time
	 */
	public seek(time: number): void {
		this.currentTime = math.clamp(time, 0, this.totalDuration);
	}
}
