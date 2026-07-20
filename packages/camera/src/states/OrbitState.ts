import { Logger } from "@trembus/logger";
import { CameraUtils } from "../CameraUtils";
import type { ICameraState, OrbitStateContext } from "../interfaces";

const logger = Logger.create("camera:OrbitState");

/**
 * Default configuration for OrbitState
 */
const DEFAULTS = {
	RADIUS: 12,
	HORIZONTAL_ANGLE: 0,
	VERTICAL_ANGLE: 0.3, // Slightly above horizontal
	SMOOTHING: 0.12,
	HORIZONTAL_SPEED: 2.0,
	VERTICAL_SPEED: 1.5,
	MIN_VERTICAL: -0.8,
	MAX_VERTICAL: 1.2,
	MIN_RADIUS: 5,
	MAX_RADIUS: 25,
} as const;

/**
 * Orbit camera state.
 * Circles around a target with user input control.
 * Great for combat lock-on, item inspection, or character selection.
 */
export class OrbitState implements ICameraState {
	public readonly name = "orbit";

	private target?: Model | BasePart;
	private radius: number = DEFAULTS.RADIUS;
	private horizontalAngle: number = DEFAULTS.HORIZONTAL_ANGLE;
	private verticalAngle: number = DEFAULTS.VERTICAL_ANGLE;
	private smoothing: number = DEFAULTS.SMOOTHING;
	private currentCFrame: CFrame = new CFrame();

	// Input state
	private inputEnabled: boolean = true;
	private inputConnection?: RBXScriptConnection;
	private scrollConnection?: RBXScriptConnection;
	private deltaX: number = 0;
	private deltaY: number = 0;
	private deltaScroll: number = 0;

	public enter(camera: Camera, context?: unknown): void {
		const ctx = context as OrbitStateContext | undefined;

		if (!ctx?.target) {
			logger.warn("OrbitState entered without a target");
			return;
		}

		this.target = ctx.target;
		this.radius = ctx.radius ?? DEFAULTS.RADIUS;
		this.horizontalAngle = ctx.initialAngle ?? DEFAULTS.HORIZONTAL_ANGLE;
		this.verticalAngle = ctx.verticalAngle ?? DEFAULTS.VERTICAL_ANGLE;
		this.smoothing = ctx.smoothing ?? DEFAULTS.SMOOTHING;

		// Initialize camera position
		const targetPosition = this.getTargetPosition();
		if (targetPosition) {
			const cameraPosition = CameraUtils.calculateOrbitPosition(
				targetPosition,
				this.radius,
				this.horizontalAngle,
				this.verticalAngle,
			);
			this.currentCFrame = CameraUtils.lookAt(cameraPosition, targetPosition);
		}

		camera.CameraType = Enum.CameraType.Scriptable;

		// Connect input
		this.connectInput();

		logger.info(`Orbiting target at radius: ${this.radius}`);
	}

	public exit(_camera: Camera): void {
		this.disconnectInput();
		this.target = undefined;
		logger.debug("Exiting OrbitState");
	}

	public update(_camera: Camera, dt: number): CFrame {
		const targetPosition = this.getTargetPosition();

		if (!targetPosition) {
			return this.currentCFrame;
		}

		// Apply input to angles
		if (this.inputEnabled) {
			this.horizontalAngle += this.deltaX * DEFAULTS.HORIZONTAL_SPEED * dt;
			this.verticalAngle -= this.deltaY * DEFAULTS.VERTICAL_SPEED * dt;

			// Clamp vertical angle
			this.verticalAngle = math.clamp(this.verticalAngle, DEFAULTS.MIN_VERTICAL, DEFAULTS.MAX_VERTICAL);

			// Apply scroll to radius
			this.radius -= this.deltaScroll * dt * 10;
			this.radius = math.clamp(this.radius, DEFAULTS.MIN_RADIUS, DEFAULTS.MAX_RADIUS);

			// Reset deltas
			this.deltaX = 0;
			this.deltaY = 0;
			this.deltaScroll = 0;
		}

		// Calculate orbit position
		const cameraPosition = CameraUtils.calculateOrbitPosition(
			targetPosition,
			this.radius,
			this.horizontalAngle,
			this.verticalAngle,
		);

		// Look at target (slightly elevated)
		const lookAtPosition = targetPosition.add(new Vector3(0, 2, 0));
		const targetCFrame = CameraUtils.lookAt(cameraPosition, lookAtPosition);

		// Smooth interpolation
		this.currentCFrame = CameraUtils.smoothDamp(this.currentCFrame, targetCFrame, this.smoothing, dt);

		return this.currentCFrame;
	}

	/**
	 * Set input enabled state
	 */
	public setInputEnabled(enabled: boolean): void {
		this.inputEnabled = enabled;
	}

	/**
	 * Manually rotate the orbit (for gamepad or custom input)
	 */
	public rotate(horizontal: number, vertical: number): void {
		this.deltaX += horizontal;
		this.deltaY += vertical;
	}

	/**
	 * Manually adjust radius
	 */
	public zoom(delta: number): void {
		this.deltaScroll += delta;
	}

	/**
	 * Set the orbit radius
	 */
	public setRadius(radius: number): void {
		this.radius = math.clamp(radius, DEFAULTS.MIN_RADIUS, DEFAULTS.MAX_RADIUS);
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

	private connectInput(): void {
		const UserInputService = game.GetService("UserInputService");

		// Mouse movement for orbit rotation
		this.inputConnection = UserInputService.InputChanged.Connect((input) => {
			if (input.UserInputType === Enum.UserInputType.MouseMovement) {
				// Only process when right mouse button is held
				if (UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton2)) {
					this.deltaX += input.Delta.X * 0.01;
					this.deltaY += input.Delta.Y * 0.01;
				}
			}
		});

		// Mouse wheel for zoom
		this.scrollConnection = UserInputService.InputChanged.Connect((input) => {
			if (input.UserInputType === Enum.UserInputType.MouseWheel) {
				this.deltaScroll += input.Position.Z;
			}
		});
	}

	private disconnectInput(): void {
		this.inputConnection?.Disconnect();
		this.scrollConnection?.Disconnect();
		this.inputConnection = undefined;
		this.scrollConnection = undefined;
	}
}
