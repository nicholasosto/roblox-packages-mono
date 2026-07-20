import { Logger } from "@trembus/logger";

const logger = Logger.create("camera:Shake");

/**
 * Shake preset configurations
 */
export const ShakePresets = {
	/** Light impact - weapon hit, small explosion */
	LIGHT: {
		magnitude: 0.3,
		roughness: 15,
		fadeInTime: 0,
		fadeOutTime: 0.3,
		positionInfluence: new Vector3(0.1, 0.1, 0.1),
		rotationInfluence: new Vector3(1, 1, 0.5),
	},
	/** Medium impact - ability hit, medium explosion */
	MEDIUM: {
		magnitude: 0.6,
		roughness: 12,
		fadeInTime: 0,
		fadeOutTime: 0.5,
		positionInfluence: new Vector3(0.15, 0.15, 0.15),
		rotationInfluence: new Vector3(1, 1, 0.5),
	},
	/** Heavy impact - big explosion, boss attack */
	HEAVY: {
		magnitude: 1.0,
		roughness: 10,
		fadeInTime: 0,
		fadeOutTime: 0.75,
		positionInfluence: new Vector3(0.25, 0.25, 0.2),
		rotationInfluence: new Vector3(1.5, 1.5, 1),
	},
	/** Earthquake - sustained shaking */
	EARTHQUAKE: {
		magnitude: 0.8,
		roughness: 6,
		fadeInTime: 0.5,
		fadeOutTime: 1.0,
		positionInfluence: new Vector3(0.3, 0.5, 0.3),
		rotationInfluence: new Vector3(0.5, 0.5, 1),
	},
	/** Rumble - low frequency sustained shake */
	RUMBLE: {
		magnitude: 0.4,
		roughness: 4,
		fadeInTime: 0.2,
		fadeOutTime: 0.5,
		positionInfluence: new Vector3(0.1, 0.2, 0.1),
		rotationInfluence: new Vector3(0.3, 0.3, 0.5),
	},
	/** Explosion - quick intense shake */
	EXPLOSION: {
		magnitude: 1.5,
		roughness: 20,
		fadeInTime: 0,
		fadeOutTime: 0.4,
		positionInfluence: new Vector3(0.3, 0.4, 0.3),
		rotationInfluence: new Vector3(2, 2, 1),
	},
} as const;

export type ShakePresetName = keyof typeof ShakePresets;

/**
 * Configuration for a camera shake instance
 */
export interface ShakeConfig {
	/** Overall shake strength (0-2+) */
	magnitude: number;
	/** Shake frequency/speed (1-30, higher = faster) */
	roughness: number;
	/** Time to reach full magnitude */
	fadeInTime: number;
	/** Time to fade out to zero */
	fadeOutTime: number;
	/** How much position is affected (X, Y, Z) */
	positionInfluence: Vector3;
	/** How much rotation is affected (pitch, yaw, roll) in degrees */
	rotationInfluence: Vector3;
}

/**
 * Active shake instance
 */
interface ShakeInstance {
	config: ShakeConfig;
	timeRemaining: number;
	totalTime: number;
	seed: number;
	sustainTime?: number; // If set, shake sustains at full magnitude for this duration
}

/**
 * Camera shake effect manager.
 * Can layer multiple shakes and applies them as CFrame offset.
 */
export class CameraShake {
	private activeShakes: ShakeInstance[] = [];
	private currentOffset: CFrame = new CFrame();

	/**
	 * Start a shake effect using a preset
	 * @param preset - Name of the preset to use
	 * @param sustainTime - Optional time to sustain at full magnitude before fading
	 * @returns Shake ID for manual control
	 */
	public shakePreset(preset: ShakePresetName, sustainTime?: number): number {
		const config = ShakePresets[preset];
		return this.shake({ ...config }, sustainTime);
	}

	/**
	 * Start a custom shake effect
	 * @param config - Shake configuration
	 * @param sustainTime - Optional time to sustain at full magnitude before fading
	 * @returns Shake ID for manual control
	 */
	public shake(config: ShakeConfig, sustainTime?: number): number {
		const totalTime = config.fadeInTime + (sustainTime ?? 0) + config.fadeOutTime;

		const instance: ShakeInstance = {
			config,
			timeRemaining: totalTime,
			totalTime,
			seed: math.random() * 1000,
			sustainTime,
		};

		this.activeShakes.push(instance);
		logger.debug(`Shake started: magnitude=${config.magnitude}, duration=${totalTime}s`);

		return this.activeShakes.size() - 1;
	}

	/**
	 * Start an earthquake shake (sustained duration)
	 * @param duration - How long the earthquake lasts
	 * @param magnitude - Shake strength multiplier (default 1.0)
	 */
	public earthquake(duration: number, magnitude: number = 1.0): number {
		const config = { ...ShakePresets.EARTHQUAKE };
		config.magnitude *= magnitude;
		return this.shake(config, duration);
	}

	/**
	 * Quick explosion shake
	 * @param magnitude - Strength multiplier (default 1.0)
	 */
	public explosion(magnitude: number = 1.0): number {
		const config = { ...ShakePresets.EXPLOSION };
		config.magnitude *= magnitude;
		return this.shake(config);
	}

	/**
	 * Impact shake (for hits, collisions)
	 * @param intensity - "light" | "medium" | "heavy"
	 */
	public impact(intensity: "light" | "medium" | "heavy" = "medium"): number {
		const presetMap = {
			light: "LIGHT",
			medium: "MEDIUM",
			heavy: "HEAVY",
		} as const;
		return this.shakePreset(presetMap[intensity]);
	}

	/**
	 * Update all active shakes and return combined offset
	 * @param dt - Delta time
	 * @returns CFrame offset to apply to camera
	 */
	public update(dt: number): CFrame {
		if (this.activeShakes.size() === 0) {
			this.currentOffset = new CFrame();
			return this.currentOffset;
		}

		let totalPositionOffset = Vector3.zero;
		let totalRotationOffset = Vector3.zero;

		// Process each active shake
		const shakesToRemove: number[] = [];

		for (let i = 0; i < this.activeShakes.size(); i++) {
			const shake = this.activeShakes[i];
			shake.timeRemaining -= dt;

			if (shake.timeRemaining <= 0) {
				shakesToRemove.push(i);
				continue;
			}

			// Calculate current magnitude based on fade
			const magnitude = this.calculateMagnitude(shake);

			// Generate noise-based offset
			const time = (shake.totalTime - shake.timeRemaining) * shake.config.roughness;
			const noiseOffset = this.generateNoise(time, shake.seed);

			// Apply position influence
			const posOffset = new Vector3(
				noiseOffset.X * shake.config.positionInfluence.X * magnitude,
				noiseOffset.Y * shake.config.positionInfluence.Y * magnitude,
				noiseOffset.Z * shake.config.positionInfluence.Z * magnitude,
			);

			// Apply rotation influence (convert to radians)
			const rotOffset = new Vector3(
				noiseOffset.X * shake.config.rotationInfluence.X * magnitude * (math.pi / 180),
				noiseOffset.Y * shake.config.rotationInfluence.Y * magnitude * (math.pi / 180),
				noiseOffset.Z * shake.config.rotationInfluence.Z * magnitude * (math.pi / 180),
			);

			totalPositionOffset = totalPositionOffset.add(posOffset);
			totalRotationOffset = totalRotationOffset.add(rotOffset);
		}

		// Remove completed shakes (in reverse order to preserve indices)
		for (let i = shakesToRemove.size() - 1; i >= 0; i--) {
			this.activeShakes.remove(shakesToRemove[i]);
		}

		// Build offset CFrame
		this.currentOffset = new CFrame(totalPositionOffset).mul(
			CFrame.fromEulerAnglesXYZ(totalRotationOffset.X, totalRotationOffset.Y, totalRotationOffset.Z),
		);

		return this.currentOffset;
	}

	/**
	 * Get the current shake offset without updating
	 */
	public getCurrentOffset(): CFrame {
		return this.currentOffset;
	}

	/**
	 * Check if any shakes are active
	 */
	public isShaking(): boolean {
		return this.activeShakes.size() > 0;
	}

	/**
	 * Stop all active shakes immediately
	 */
	public stopAll(): void {
		this.activeShakes = [];
		this.currentOffset = new CFrame();
		logger.debug("All shakes stopped");
	}

	/**
	 * Calculate current magnitude based on fade in/out
	 */
	private calculateMagnitude(shake: ShakeInstance): number {
		const { fadeInTime, fadeOutTime } = shake.config;
		const elapsed = shake.totalTime - shake.timeRemaining;

		let magnitude = shake.config.magnitude;

		if (elapsed < fadeInTime && fadeInTime > 0) {
			// Fade in phase
			magnitude *= elapsed / fadeInTime;
		} else if (shake.timeRemaining < fadeOutTime && fadeOutTime > 0) {
			// Fade out phase
			magnitude *= shake.timeRemaining / fadeOutTime;
		}
		// Sustain phase uses full magnitude

		return magnitude;
	}

	/**
	 * Generate pseudo-random noise for shake offset
	 * Uses multiple sine waves for organic feel
	 */
	private generateNoise(time: number, seed: number): Vector3 {
		// Layer multiple frequencies for more organic shake
		const noise = (t: number, s: number) => {
			return (
				math.sin(t * 1.0 + s) * 0.5 +
				math.sin(t * 2.3 + s * 1.3) * 0.3 +
				math.sin(t * 4.1 + s * 0.7) * 0.2
			);
		};

		return new Vector3(
			noise(time, seed),
			noise(time * 1.1, seed + 100),
			noise(time * 0.9, seed + 200),
		);
	}
}
