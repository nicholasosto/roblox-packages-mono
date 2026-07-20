import { Logger } from "@trembus/logger";
import type { ICameraState, FixedStateContext } from "../interfaces";
import { CameraUtils } from "../CameraUtils";

const logger = Logger.create("camera:FixedState");

/**
 * Fixed camera state.
 * Places the camera at a static position looking at a target point.
 * Useful for cutscenes, menus, or specific viewing angles.
 */
export class FixedState implements ICameraState {
	public readonly name = "fixed";

	private position: Vector3 = Vector3.zero;
	private lookAt: Vector3 = Vector3.zero;
	private fixedCFrame: CFrame = new CFrame();

	public enter(camera: Camera, context?: unknown): void {
		const ctx = context as FixedStateContext | undefined;

		if (!ctx) {
			logger.warn("FixedState entered without position/lookAt context");
			return;
		}

		this.position = ctx.position;
		this.lookAt = ctx.lookAt;
		this.fixedCFrame = CameraUtils.lookAt(this.position, this.lookAt);

		camera.CameraType = Enum.CameraType.Scriptable;
		camera.CFrame = this.fixedCFrame;

		logger.info(`Fixed camera at ${this.position} looking at ${this.lookAt}`);
	}

	public exit(_camera: Camera): void {
		logger.debug("Exiting FixedState");
	}

	public update(_camera: Camera, _dt: number): CFrame {
		// Fixed camera doesn't move - just return the same CFrame
		return this.fixedCFrame;
	}

	/**
	 * Update the fixed position at runtime
	 */
	public setPosition(position: Vector3, lookAt: Vector3): void {
		this.position = position;
		this.lookAt = lookAt;
		this.fixedCFrame = CameraUtils.lookAt(this.position, this.lookAt);
	}
}
