import { Logger } from "@trembus/logger";
import { CameraUtils } from "../CameraUtils";
import type { FollowStateContext, ICameraState } from "../interfaces";

const logger = Logger.create("camera:FollowState");

/**
 * Default configuration for FollowState
 */
const DEFAULTS = {
	OFFSET: new Vector3(0, 8, -12),
	DISTANCE: 15,
	SMOOTHING: 0.15,
	LOOK_AHEAD_FACTOR: 0.5,
	FOCUS_BLEND: 0.7, // How much to look at focus target vs follow target
	FOCUS_BLEND_SPEED: 3.0, // How fast to blend to focus target
	// Lock-on camera settings
	LOCK_ON_LOOK_BLEND: 0.35, // How much to look toward target (0.35 = mostly player, some target)
	LOCK_ON_POSITION_BLEND: 0.15, // How much camera moves toward midpoint (keeps both in view)
	LOCK_ON_HEIGHT_BOOST: 2, // Extra height when locked on
} as const;

/**
 * Third-person follow camera state.
 * Follows a target with configurable offset and smooth interpolation.
 */
export class FollowState implements ICameraState {
	public readonly name = "follow";

	private target?: Model | BasePart;
	private focusTarget?: Model | BasePart;
	private offset: Vector3 = DEFAULTS.OFFSET;
	private smoothing: number = DEFAULTS.SMOOTHING;
	private currentCFrame: CFrame = new CFrame();
	private checkOcclusion: boolean = true;
	private focusBlend: number = DEFAULTS.FOCUS_BLEND;
	private currentFocusBlend: number = 0; // Current interpolated blend value

	public enter(camera: Camera, context?: unknown): void {
		const ctx = context as FollowStateContext | undefined;

		if (!ctx?.target) {
			logger.warn("FollowState entered without a target");
			return;
		}

		this.target = ctx.target;
		this.offset = ctx.offset ?? DEFAULTS.OFFSET;
		this.smoothing = ctx.smoothing ?? DEFAULTS.SMOOTHING;
		this.focusTarget = ctx.focusTarget;
		this.focusBlend = ctx.focusBlend ?? DEFAULTS.FOCUS_BLEND;

		// Initialize current CFrame to prevent jarring first frame
		const targetPosition = this.getTargetPosition();
		if (targetPosition) {
			const cameraPosition = targetPosition.add(this.offset);
			this.currentCFrame = CameraUtils.lookAt(cameraPosition, targetPosition);
		}

		camera.CameraType = Enum.CameraType.Scriptable;
		logger.info(`Following target with offset: ${this.offset}`);
	}

	public exit(_camera: Camera): void {
		logger.debug("Exiting FollowState");
		this.target = undefined;
		this.focusTarget = undefined;
		this.currentFocusBlend = 0;
	}

	public update(_camera: Camera, dt: number): CFrame {
		const targetPosition = this.getTargetPosition();

		if (!targetPosition) {
			return this.currentCFrame;
		}

		const focusPosition = this.getFocusTargetPosition();
		let desiredPosition: Vector3;
		let lookAtPosition: Vector3;

		if (focusPosition) {
			// LOCK-ON MODE: Position camera to keep both player and target visible
			const result = this.calculateLockOnCamera(targetPosition, focusPosition, dt);
			desiredPosition = result.cameraPosition;
			lookAtPosition = result.lookAtPosition;
		} else {
			// NORMAL MODE: Standard follow camera
			desiredPosition = CameraUtils.calculateFollowPosition(
				targetPosition,
				this.getTargetCFrame(),
				this.offset,
				false,
			);
			lookAtPosition = this.calculateLookAtPosition(targetPosition, dt);
		}

		// Check for occlusion and adjust if needed
		if (this.checkOcclusion) {
			const ignoreList: Instance[] = [];
			if (this.target) ignoreList.push(this.target);
			if (this.focusTarget) ignoreList.push(this.focusTarget);
			desiredPosition = CameraUtils.checkOcclusion(targetPosition, desiredPosition, ignoreList);
		}

		// Calculate target CFrame
		const targetCFrame = CameraUtils.lookAt(desiredPosition, lookAtPosition);

		// Smooth interpolation
		this.currentCFrame = CameraUtils.smoothDamp(this.currentCFrame, targetCFrame, this.smoothing, dt);

		return this.currentCFrame;
	}

	/**
	 * Calculate camera position and look-at for lock-on mode.
	 * Keeps player centered while showing the target.
	 */
	private calculateLockOnCamera(
		playerPosition: Vector3,
		targetPosition: Vector3,
		dt: number,
	): { cameraPosition: Vector3; lookAtPosition: Vector3 } {
		// Smoothly blend to lock-on mode
		this.currentFocusBlend = math.min(this.focusBlend, this.currentFocusBlend + DEFAULTS.FOCUS_BLEND_SPEED * dt);

		// Calculate direction from player to target (horizontal only)
		const toTarget = targetPosition.sub(playerPosition);
		const horizontalToTarget = new Vector3(toTarget.X, 0, toTarget.Z);
		const distanceToTarget = horizontalToTarget.Magnitude;

		// Position camera behind player, facing toward the target
		// This keeps player in center while target is visible ahead
		let cameraDirection: Vector3;
		if (distanceToTarget > 0.1) {
			// Camera goes behind player (opposite direction of target)
			cameraDirection = horizontalToTarget.Unit.mul(-1);
		} else {
			// Target too close, use default offset direction
			cameraDirection = new Vector3(0, 0, -1);
		}

		// Calculate base camera position behind player
		const horizontalDistance = math.abs(this.offset.Z);
		const baseHeight = this.offset.Y + DEFAULTS.LOCK_ON_HEIGHT_BOOST * this.currentFocusBlend;
		
		const baseCameraPosition = playerPosition.add(
			cameraDirection.mul(horizontalDistance).add(new Vector3(0, baseHeight, 0))
		);

		// Look at a point between player and target
		// Lower blend = more toward player (keeps player centered)
		// Higher blend = more toward target
		const playerLookAt = playerPosition.add(new Vector3(0, 2, 0));
		const targetLookAt = targetPosition.add(new Vector3(0, 1.5, 0));
		const lookAtPosition = playerLookAt.Lerp(targetLookAt, DEFAULTS.LOCK_ON_LOOK_BLEND * this.currentFocusBlend);

		return {
			cameraPosition: baseCameraPosition,
			lookAtPosition: lookAtPosition,
		};
	}

	/**
	 * Calculate the look-at position, blending between follow target and focus target
	 */
	private calculateLookAtPosition(followTargetPosition: Vector3, dt: number): Vector3 {
		const defaultLookAt = followTargetPosition.add(new Vector3(0, 2, 0)); // Slightly above follow target

		// Get focus target position
		const focusPosition = this.getFocusTargetPosition();

		if (!focusPosition) {
			// No focus target - smoothly blend back to follow target
			this.currentFocusBlend = math.max(0, this.currentFocusBlend - DEFAULTS.FOCUS_BLEND_SPEED * dt);
		} else {
			// Has focus target - smoothly blend towards it
			this.currentFocusBlend = math.min(this.focusBlend, this.currentFocusBlend + DEFAULTS.FOCUS_BLEND_SPEED * dt);
		}

		// If no blend needed, return default
		if (this.currentFocusBlend <= 0.001) {
			return defaultLookAt;
		}

		// Calculate blended look-at position
		const focusLookAt = focusPosition ? focusPosition.add(new Vector3(0, 1.5, 0)) : defaultLookAt;

		// Lerp between follow target and focus target
		return defaultLookAt.Lerp(focusLookAt, this.currentFocusBlend);
	}

	/**
	 * Update the follow target at runtime
	 */
	public setTarget(target: Model | BasePart): void {
		this.target = target;
	}

	/**
	 * Update the offset at runtime
	 */
	public setOffset(offset: Vector3): void {
		this.offset = offset;
	}

	/**
	 * Set whether to check for camera occlusion
	 */
	public setOcclusionCheck(enabled: boolean): void {
		this.checkOcclusion = enabled;
	}

	/**
	 * Set the focus target (what the camera looks at while following)
	 * @param target - The target to look at, or undefined to clear
	 */
	public setFocusTarget(target: Model | BasePart | undefined): void {
		this.focusTarget = target;
		if (target) {
			logger.debug(`Focus target set: ${target.Name}`);
		} else {
			logger.debug("Focus target cleared");
		}
	}

	/**
	 * Get the current focus target
	 */
	public getFocusTarget(): Model | BasePart | undefined {
		return this.focusTarget;
	}

	/**
	 * Set the focus blend factor
	 * @param blend - 0 = look at follow target, 1 = look at focus target
	 */
	public setFocusBlend(blend: number): void {
		this.focusBlend = math.clamp(blend, 0, 1);
	}

	/**
	 * Check if currently focusing on a target
	 */
	public hasFocusTarget(): boolean {
		return this.focusTarget !== undefined;
	}

	private getTargetPosition(): Vector3 | undefined {
		if (!this.target) return undefined;

		if (this.target.IsA("Model")) {
			return this.target.GetPivot().Position;
		} else if (this.target.IsA("BasePart")) {
			return this.target.Position;
		}

		return undefined;
	}

	private getTargetCFrame(): CFrame | undefined {
		if (!this.target) return undefined;

		if (this.target.IsA("Model")) {
			return this.target.GetPivot();
		} else if (this.target.IsA("BasePart")) {
			return this.target.CFrame;
		}

		return undefined;
	}

	private getFocusTargetPosition(): Vector3 | undefined {
		if (!this.focusTarget) return undefined;

		if (this.focusTarget.IsA("Model")) {
			return this.focusTarget.GetPivot().Position;
		} else if (this.focusTarget.IsA("BasePart")) {
			return this.focusTarget.Position;
		}

		return undefined;
	}
}
