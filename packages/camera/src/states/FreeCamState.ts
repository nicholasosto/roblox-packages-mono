import { Logger } from "@trembus/logger";
import type { FreeCamStateContext, ICameraState } from "../interfaces";

const logger = Logger.create("camera:FreeCamState");

/**
 * Default configuration for FreeCamState
 */
const DEFAULTS = {
	SPEED: 50,
	SENSITIVITY: 0.002,
	FAST_MULTIPLIER: 3,
	SLOW_MULTIPLIER: 0.3,
} as const;

/**
 * Free camera state for debug/spectator mode.
 * WASD movement with mouse look.
 * Useful for development, testing, and spectator features.
 */
export class FreeCamState implements ICameraState {
	public readonly name = "freecam";

	private speed: number = DEFAULTS.SPEED;
	private sensitivity: number = DEFAULTS.SENSITIVITY;
	private currentCFrame: CFrame = new CFrame();

	// Input state
	private inputConnections: RBXScriptConnection[] = [];
	private moveDirection: Vector3 = Vector3.zero;
	private yaw: number = 0;
	private pitch: number = 0;
	private fastMode: boolean = false;
	private slowMode: boolean = false;

	// Key states
	private keys = {
		W: false,
		A: false,
		S: false,
		D: false,
		Q: false, // Down
		E: false, // Up
	};

	public enter(camera: Camera, context?: unknown): void {
		const ctx = context as FreeCamStateContext | undefined;

		this.speed = ctx?.speed ?? DEFAULTS.SPEED;
		this.sensitivity = ctx?.sensitivity ?? DEFAULTS.SENSITIVITY;

		// Initialize from current camera position or provided position
		if (ctx?.initialPosition) {
			this.currentCFrame = new CFrame(ctx.initialPosition);
		} else {
			this.currentCFrame = camera.CFrame;
		}

		// Extract yaw and pitch from current CFrame
		const [_, ry] = this.currentCFrame.ToEulerAnglesYXZ();
		this.yaw = ry;
		this.pitch = 0;

		camera.CameraType = Enum.CameraType.Scriptable;

		// Lock mouse
		const UserInputService = game.GetService("UserInputService");
		UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;

		// Connect input
		this.connectInput();

		logger.info("FreeCam enabled - WASD to move, mouse to look, Shift=fast, Ctrl=slow");
	}

	public exit(_camera: Camera): void {
		this.disconnectInput();

		// Unlock mouse
		const UserInputService = game.GetService("UserInputService");
		UserInputService.MouseBehavior = Enum.MouseBehavior.Default;

		// Reset key states
		this.keys = { W: false, A: false, S: false, D: false, Q: false, E: false };

		logger.debug("Exiting FreeCamState");
	}

	public update(_camera: Camera, dt: number): CFrame {
		// Calculate move direction from key states
		let forward = 0;
		let right = 0;
		let up = 0;

		if (this.keys.W) forward += 1;
		if (this.keys.S) forward -= 1;
		if (this.keys.D) right += 1;
		if (this.keys.A) right -= 1;
		if (this.keys.E) up += 1;
		if (this.keys.Q) up -= 1;

		// Apply speed modifiers
		let currentSpeed = this.speed;
		if (this.fastMode) currentSpeed *= DEFAULTS.FAST_MULTIPLIER;
		if (this.slowMode) currentSpeed *= DEFAULTS.SLOW_MULTIPLIER;

		// Build rotation CFrame from yaw and pitch
		const rotationCFrame = CFrame.fromEulerAnglesYXZ(this.pitch, this.yaw, 0);

		// Calculate movement in camera space
		const localMove = new Vector3(right, up, -forward);

		if (localMove.Magnitude > 0) {
			const worldMove = rotationCFrame.VectorToWorldSpace(localMove.Unit);
			const delta = worldMove.mul(currentSpeed * dt);
			this.currentCFrame = new CFrame(this.currentCFrame.Position.add(delta)).mul(
				rotationCFrame.sub(rotationCFrame.Position),
			);
		} else {
			// Just apply rotation
			this.currentCFrame = new CFrame(this.currentCFrame.Position).mul(rotationCFrame.sub(rotationCFrame.Position));
		}

		return this.currentCFrame;
	}

	/**
	 * Teleport to a specific position
	 */
	public teleportTo(position: Vector3): void {
		this.currentCFrame = new CFrame(position).mul(this.currentCFrame.sub(this.currentCFrame.Position));
		logger.debug(`Teleported to ${position}`);
	}

	/**
	 * Set movement speed
	 */
	public setSpeed(speed: number): void {
		this.speed = speed;
	}

	/**
	 * Set mouse sensitivity
	 */
	public setSensitivity(sensitivity: number): void {
		this.sensitivity = sensitivity;
	}

	private connectInput(): void {
		const UserInputService = game.GetService("UserInputService");

		// Keyboard input
		this.inputConnections.push(
			UserInputService.InputBegan.Connect((input, gameProcessed) => {
				if (gameProcessed) return;
				this.handleKeyInput(input.KeyCode, true);
			}),
		);

		this.inputConnections.push(
			UserInputService.InputEnded.Connect((input) => {
				this.handleKeyInput(input.KeyCode, false);
			}),
		);

		// Mouse movement
		this.inputConnections.push(
			UserInputService.InputChanged.Connect((input) => {
				if (input.UserInputType === Enum.UserInputType.MouseMovement) {
					this.yaw -= input.Delta.X * this.sensitivity;
					this.pitch -= input.Delta.Y * this.sensitivity;

					// Clamp pitch to prevent camera flip
					this.pitch = math.clamp(this.pitch, -math.pi / 2 + 0.1, math.pi / 2 - 0.1);
				}
			}),
		);
	}

	private handleKeyInput(keyCode: Enum.KeyCode, pressed: boolean): void {
		switch (keyCode) {
			case Enum.KeyCode.W:
				this.keys.W = pressed;
				break;
			case Enum.KeyCode.A:
				this.keys.A = pressed;
				break;
			case Enum.KeyCode.S:
				this.keys.S = pressed;
				break;
			case Enum.KeyCode.D:
				this.keys.D = pressed;
				break;
			case Enum.KeyCode.Q:
				this.keys.Q = pressed;
				break;
			case Enum.KeyCode.E:
				this.keys.E = pressed;
				break;
			case Enum.KeyCode.LeftShift:
			case Enum.KeyCode.RightShift:
				this.fastMode = pressed;
				break;
			case Enum.KeyCode.LeftControl:
			case Enum.KeyCode.RightControl:
				this.slowMode = pressed;
				break;
		}
	}

	private disconnectInput(): void {
		for (const connection of this.inputConnections) {
			connection.Disconnect();
		}
		this.inputConnections = [];
	}
}
