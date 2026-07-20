import { Logger } from "@trembus/logger";
import { CameraShake, ShakePresetName } from "./effects";
import type { ICameraState } from "./interfaces";

const logger = Logger.create("CameraStateMachine");

/**
 * Manages camera states and transitions between them.
 * Handles smooth transitions and state lifecycle.
 */
export class CameraStateMachine {
	private camera?: Camera;
	private currentState?: ICameraState;
	private states = new Map<string, ICameraState>();
	private isTransitioning = false;
	private transitionProgress = 0;
	private transitionDuration = 0.3;
	private transitionStartCFrame?: CFrame;
	private pendingState?: { name: string; context?: unknown };

	// Camera shake effect
	private shake: CameraShake = new CameraShake();

	/**
	 * Initialize the state machine with a camera
	 * @param camera - The camera to control
	 */
	public initialize(camera: Camera): void {
		this.camera = camera;
		logger.info("CameraStateMachine initialized");
	}

	/**
	 * Register a camera state
	 * @param state - The state to register
	 */
	public registerState(state: ICameraState): void {
		if (this.states.has(state.name)) {
			logger.warn(`State "${state.name}" is already registered, overwriting`);
		}
		this.states.set(state.name, state);
		logger.info(`Registered state: ${state.name}`);
	}

	/**
	 * Unregister a camera state
	 * @param name - Name of the state to unregister
	 */
	public unregisterState(name: string): void {
		if (this.currentState?.name === name) {
			logger.warn(`Cannot unregister active state "${name}"`);
			return;
		}
		this.states.delete(name);
		logger.info(`Unregistered state: ${name}`);
	}

	/**
	 * Transition to a new camera state
	 * @param name - Name of the state to transition to
	 * @param context - Optional context data for the new state
	 * @param transitionDuration - Optional duration for smooth transition (default: 0.3s)
	 */
	public setState(name: string, context?: unknown, transitionDuration?: number): void {
		const newState = this.states.get(name);
		if (!newState) {
			logger.error(`State "${name}" is not registered`);
			return;
		}

		if (!this.camera) {
			logger.error("Camera not initialized");
			return;
		}

		// Check if transition is allowed
		if (this.currentState?.canTransitionTo && !this.currentState.canTransitionTo(name)) {
			logger.warn(`Transition from "${this.currentState.name}" to "${name}" not allowed`);
			return;
		}

		// If we're in a transition, queue this state change
		if (this.isTransitioning) {
			this.pendingState = { name, context };
			logger.info(`Queued transition to "${name}"`);
			return;
		}

		const previousStateName = this.currentState?.name ?? "none";
		logger.info(`Transitioning: ${previousStateName} → ${name}`);

		// Start smooth transition
		this.transitionStartCFrame = this.camera.CFrame;
		this.transitionDuration = transitionDuration ?? 0.3;
		this.transitionProgress = 0;
		this.isTransitioning = this.transitionDuration > 0;

		// Exit current state
		if (this.currentState) {
			this.currentState.exit(this.camera);
		}

		// Enter new state
		this.currentState = newState;
		this.currentState.enter(this.camera, context);
	}

	/**
	 * Immediately snap to a state without transition
	 * @param name - Name of the state
	 * @param context - Optional context data
	 */
	public setStateImmediate(name: string, context?: unknown): void {
		this.setState(name, context, 0);
	}

	/**
	 * Get the current state name
	 */
	public getCurrentStateName(): string | undefined {
		return this.currentState?.name;
	}

	/**
	 * Check if a state is registered
	 * @param name - Name of the state to check
	 */
	public hasState(name: string): boolean {
		return this.states.has(name);
	}

	/**
	 * Update the camera state machine (call from OnRender)
	 * @param dt - Delta time since last frame
	 */
	public update(dt: number): void {
		if (!this.camera || !this.currentState) {
			return;
		}

		// Get target CFrame from current state
		let targetCFrame = this.currentState.update(this.camera, dt);

		// Apply camera CFrame with optional transition smoothing
		if (this.isTransitioning && this.transitionStartCFrame) {
			this.transitionProgress += dt / this.transitionDuration;

			if (this.transitionProgress >= 1) {
				// Transition complete
				this.isTransitioning = false;
				this.transitionStartCFrame = undefined;

				// Process pending state if any
				if (this.pendingState) {
					const pending = this.pendingState;
					this.pendingState = undefined;
					this.setState(pending.name, pending.context);
				}
			} else {
				// Interpolate between start and target
				const easedProgress = game
					.GetService("TweenService")
					.GetValue(this.transitionProgress, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
				targetCFrame = this.transitionStartCFrame.Lerp(targetCFrame, easedProgress);
			}
		}

		// Apply shake effect on top of the camera CFrame
		const shakeOffset = this.shake.update(dt);
		this.camera.CFrame = targetCFrame.mul(shakeOffset);
	}

	/**
	 * Get list of all registered state names
	 */
	public getRegisteredStates(): string[] {
		const stateNames: string[] = [];
		this.states.forEach((_, name) => stateNames.push(name));
		return stateNames;
	}

	/**
	 * Check if currently in a transition
	 */
	public isInTransition(): boolean {
		return this.isTransitioning;
	}

	/**
	 * Force cancel current transition
	 */
	public cancelTransition(): void {
		this.isTransitioning = false;
		this.transitionStartCFrame = undefined;
		this.transitionProgress = 0;
		this.pendingState = undefined;
	}

	/**
	 * Cleanup the state machine
	 */
	public destroy(): void {
		if (this.currentState && this.camera) {
			this.currentState.exit(this.camera);
		}
		this.currentState = undefined;
		this.camera = undefined;
		this.states.clear();
		this.shake.stopAll();
		logger.info("CameraStateMachine destroyed");
	}

	// ============================================
	// Camera Shake API
	// ============================================

	/**
	 * Trigger a camera shake using a preset
	 * @param preset - Preset name: "LIGHT", "MEDIUM", "HEAVY", "EARTHQUAKE", "RUMBLE", "EXPLOSION"
	 * @param sustainTime - Optional sustain duration before fade out
	 */
	public shakePreset(preset: ShakePresetName, sustainTime?: number): void {
		this.shake.shakePreset(preset, sustainTime);
	}

	/**
	 * Trigger an earthquake shake effect
	 * @param duration - How long the earthquake lasts
	 * @param magnitude - Intensity multiplier (default 1.0)
	 */
	public earthquake(duration: number, magnitude?: number): void {
		this.shake.earthquake(duration, magnitude);
	}

	/**
	 * Trigger an explosion shake effect
	 * @param magnitude - Intensity multiplier (default 1.0)
	 */
	public explosion(magnitude?: number): void {
		this.shake.explosion(magnitude);
	}

	/**
	 * Trigger an impact shake effect
	 * @param intensity - "light", "medium", or "heavy"
	 */
	public impact(intensity?: "light" | "medium" | "heavy"): void {
		this.shake.impact(intensity);
	}

	/**
	 * Stop all active shakes immediately
	 */
	public stopShake(): void {
		this.shake.stopAll();
	}

	/**
	 * Check if camera is currently shaking
	 */
	public isShaking(): boolean {
		return this.shake.isShaking();
	}

	/**
	 * Get the shake manager for advanced usage
	 */
	public getShakeManager(): CameraShake {
		return this.shake;
	}
}
