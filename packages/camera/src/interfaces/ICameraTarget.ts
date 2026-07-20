/**
 * Interface for objects that can be tracked by the camera
 */
export interface ICameraTarget {
	/**
	 * Get the current world position of the target
	 */
	getPosition(): Vector3;

	/**
	 * Optional: Get the orientation of the target
	 */
	getOrientation?(): CFrame;

	/**
	 * Optional: Get the velocity for prediction
	 */
	getVelocity?(): Vector3;

	/**
	 * Optional: Check if the target is still valid
	 */
	isValid?(): boolean;
}

/**
 * Adapter to wrap a Model as an ICameraTarget
 */
export class ModelCameraTarget implements ICameraTarget {
	constructor(private model: Model) {}

	getPosition(): Vector3 {
		return this.model.GetPivot().Position;
	}

	getOrientation(): CFrame {
		return this.model.GetPivot();
	}

	getVelocity(): Vector3 {
		const primaryPart = this.model.PrimaryPart;
		if (primaryPart && primaryPart.IsA("BasePart")) {
			return primaryPart.AssemblyLinearVelocity;
		}
		return Vector3.zero;
	}

	isValid(): boolean {
		return this.model !== undefined && this.model.Parent !== undefined;
	}
}

/**
 * Adapter to wrap a BasePart as an ICameraTarget
 */
export class PartCameraTarget implements ICameraTarget {
	constructor(private part: BasePart) {}

	getPosition(): Vector3 {
		return this.part.Position;
	}

	getOrientation(): CFrame {
		return this.part.CFrame;
	}

	getVelocity(): Vector3 {
		return this.part.AssemblyLinearVelocity;
	}

	isValid(): boolean {
		return this.part !== undefined && this.part.Parent !== undefined;
	}
}
