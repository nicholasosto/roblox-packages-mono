import type { CinematicKeyframe } from "./interfaces";

/**
 * Default smoothing factor for camera interpolation
 */
export const DEFAULT_SMOOTHING = 0.1;

/**
 * Linearly interpolate between two CFrames
 * @param current - Current camera CFrame
 * @param target - Target camera CFrame
 * @param alpha - Interpolation factor (0-1), typically smoothing * dt * 60
 * @returns Interpolated CFrame
 */
export function lerp(current: CFrame, target: CFrame, alpha: number): CFrame {
	const clampedAlpha = math.clamp(alpha, 0, 1);
	return current.Lerp(target, clampedAlpha);
}

/**
 * Smooth damp interpolation (frame-rate independent smoothing)
 * @param current - Current value
 * @param target - Target value
 * @param smoothing - Smoothing factor (lower = smoother, 0.1 is good default)
 * @param dt - Delta time
 * @returns Smoothed CFrame
 */
export function smoothDamp(current: CFrame, target: CFrame, smoothing: number, dt: number): CFrame {
	// Frame-rate independent smoothing formula
	const alpha = 1 - math.pow(1 - smoothing, dt * 60);
	return lerp(current, target, alpha);
}

/**
 * Spring physics-based camera interpolation
 */
export interface SpringState {
	position: Vector3;
	velocity: Vector3;
}

/**
 * Apply spring physics to camera position
 * @param state - Current spring state (position and velocity)
 * @param target - Target position
 * @param stiffness - Spring stiffness (higher = snappier, ~100-300)
 * @param damping - Damping factor (higher = less oscillation, ~10-30)
 * @param dt - Delta time
 * @returns Updated spring state
 */
export function springStep(
	state: SpringState,
	target: Vector3,
	stiffness: number,
	damping: number,
	dt: number,
): SpringState {
	const displacement = target.sub(state.position);
	const springForce = displacement.mul(stiffness);
	const dampingForce = state.velocity.mul(damping);
	const acceleration = springForce.sub(dampingForce);

	const newVelocity = state.velocity.add(acceleration.mul(dt));
	const newPosition = state.position.add(newVelocity.mul(dt));

	return {
		position: newPosition,
		velocity: newVelocity,
	};
}

/**
 * Create a CFrame looking at a target from a position
 * @param position - Camera position
 * @param lookAtTarget - Target to look at
 * @param up - Up vector (default: Y-up)
 * @returns CFrame positioned at `position` looking at `lookAtTarget`
 */
export function lookAt(position: Vector3, lookAtTarget: Vector3, up: Vector3 = Vector3.yAxis): CFrame {
	return CFrame.lookAt(position, lookAtTarget, up);
}

/**
 * Calculate camera position for following a target with offset
 * @param targetPosition - Position of the target
 * @param targetCFrame - Orientation of the target (for relative offset)
 * @param offset - Offset from target (in target's local space if useLocalOffset)
 * @param useLocalOffset - Whether to apply offset in target's local space
 * @returns World position for camera
 */
export function calculateFollowPosition(
	targetPosition: Vector3,
	targetCFrame: CFrame | undefined,
	offset: Vector3,
	useLocalOffset: boolean = false,
): Vector3 {
	if (useLocalOffset && targetCFrame) {
		// Transform offset to world space based on target orientation
		return targetCFrame.Position.add(targetCFrame.VectorToWorldSpace(offset));
	}
	return targetPosition.add(offset);
}

/**
 * Calculate camera position for orbiting around a target
 * @param targetPosition - Center of orbit
 * @param radius - Distance from target
 * @param horizontalAngle - Horizontal angle in radians
 * @param verticalAngle - Vertical angle in radians (clamped to prevent flip)
 * @returns World position for camera
 */
export function calculateOrbitPosition(
	targetPosition: Vector3,
	radius: number,
	horizontalAngle: number,
	verticalAngle: number,
): Vector3 {
	// Clamp vertical angle to prevent camera flip
	const clampedVertical = math.clamp(verticalAngle, -math.pi / 2 + 0.1, math.pi / 2 - 0.1);

	const x = radius * math.cos(clampedVertical) * math.sin(horizontalAngle);
	const y = radius * math.sin(clampedVertical);
	const z = radius * math.cos(clampedVertical) * math.cos(horizontalAngle);

	return targetPosition.add(new Vector3(x, y, z));
}

/**
 * Interpolate through cinematic keyframes
 * @param keyframes - Array of keyframes with time and CFrame
 * @param currentTime - Current time in the sequence
 * @returns Interpolated CFrame at current time
 */
export function evaluateKeyframes(keyframes: CinematicKeyframe[], currentTime: number): CFrame {
	if (keyframes.size() === 0) {
		return new CFrame();
	}

	if (keyframes.size() === 1) {
		return keyframes[0].cframe;
	}

	// Find surrounding keyframes
	let prevKeyframe = keyframes[0];
	let nextKeyframe = keyframes[keyframes.size() - 1];

	for (let i = 0; i < keyframes.size() - 1; i++) {
		if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
			prevKeyframe = keyframes[i];
			nextKeyframe = keyframes[i + 1];
			break;
		}
	}

	// Handle before first or after last keyframe
	if (currentTime <= prevKeyframe.time) {
		return prevKeyframe.cframe;
	}
	if (currentTime >= nextKeyframe.time) {
		return nextKeyframe.cframe;
	}

	// Calculate interpolation alpha
	const duration = nextKeyframe.time - prevKeyframe.time;
	const elapsed = currentTime - prevKeyframe.time;
	let alpha = duration > 0 ? elapsed / duration : 1;

	// Apply easing
	const easingStyle = nextKeyframe.easingStyle ?? Enum.EasingStyle.Quad;
	const easingDirection = nextKeyframe.easingDirection ?? Enum.EasingDirection.Out;
	alpha = game.GetService("TweenService").GetValue(alpha, easingStyle, easingDirection);

	return prevKeyframe.cframe.Lerp(nextKeyframe.cframe, alpha);
}

/**
 * Perform a raycast to check for camera occlusion
 * @param from - Start position (target)
 * @param to - End position (desired camera position)
 * @param ignoreList - Instances to ignore in raycast
 * @returns Safe camera position (either original or adjusted for collision)
 */
export function checkOcclusion(from: Vector3, to: Vector3, ignoreList?: Instance[]): Vector3 {
	const direction = to.sub(from);
	const raycastParams = new RaycastParams();
	raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
	raycastParams.FilterDescendantsInstances = ignoreList ?? [];

	const result = game.Workspace.Raycast(from, direction, raycastParams);

	if (result) {
		// Move camera slightly in front of the hit point
		const safeDistance = result.Distance - 0.5;
		if (safeDistance > 0) {
			return from.add(direction.Unit.mul(safeDistance));
		}
		return from;
	}

	return to;
}

/**
 * CameraUtils namespace for convenience access
 */
export const CameraUtils = {
	DEFAULT_SMOOTHING,
	lerp,
	smoothDamp,
	springStep,
	lookAt,
	calculateFollowPosition,
	calculateOrbitPosition,
	evaluateKeyframes,
	checkOcclusion,
};
