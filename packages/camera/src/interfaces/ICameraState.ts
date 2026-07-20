/**
 * Interface for camera states in the state machine pattern.
 * Each state handles a specific camera behavior (follow, orbit, cinematic, etc.)
 */
export interface ICameraState {
	/** Unique name identifier for this state */
	readonly name: string;

	/**
	 * Called when entering this state
	 * @param camera - The camera instance to control
	 * @param context - Optional context data for state initialization
	 */
	enter(camera: Camera, context?: unknown): void;

	/**
	 * Called when exiting this state
	 * @param camera - The camera instance
	 */
	exit(camera: Camera): void;

	/**
	 * Called every render frame to update camera position
	 * @param camera - The camera instance to update
	 * @param dt - Delta time since last frame
	 * @returns The target CFrame for the camera
	 */
	update(camera: Camera, dt: number): CFrame;

	/**
	 * Optional: Check if transition to another state is allowed
	 * @param nextState - The name of the state to transition to
	 * @returns Whether the transition is permitted
	 */
	canTransitionTo?(nextState: string): boolean;
}

/**
 * Context for FollowState initialization
 */
export interface FollowStateContext {
	target: Model | BasePart;
	offset?: Vector3;
	distance?: number;
	smoothing?: number;
	/** Optional focus target - camera will look at this instead of the follow target */
	focusTarget?: Model | BasePart;
	/** Blend factor for looking between follow target and focus target (0 = follow, 1 = focus) */
	focusBlend?: number;
}

/**
 * Context for FixedState initialization
 */
export interface FixedStateContext {
	position: Vector3;
	lookAt: Vector3;
}

/**
 * Context for OrbitState initialization
 */
export interface OrbitStateContext {
	target: Model | BasePart;
	radius?: number;
	initialAngle?: number;
	verticalAngle?: number;
	smoothing?: number;
}

/**
 * Keyframe for cinematic camera sequences
 */
export interface CinematicKeyframe {
	cframe: CFrame;
	time: number;
	easingStyle?: Enum.EasingStyle;
	easingDirection?: Enum.EasingDirection;
}

/**
 * Context for CinematicState initialization
 */
export interface CinematicStateContext {
	keyframes: CinematicKeyframe[];
	onComplete?: () => void;
	loop?: boolean;
}

/**
 * Context for FreeCamState initialization
 */
export interface FreeCamStateContext {
	speed?: number;
	sensitivity?: number;
	initialPosition?: Vector3;
}
