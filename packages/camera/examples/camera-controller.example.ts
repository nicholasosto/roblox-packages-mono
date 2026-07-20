/**
 * Example: Flamework client controller wrapping @trembus/camera.
 *
 * This file is NOT compiled — it's a reference for consumers showing
 * how to integrate the camera package with Flamework on the client.
 *
 * Copy this into your game's src/client/controllers/ directory and adjust as needed.
 *
 * Pattern (from the original soul-steel integration): the controller leaves
 * Roblox's default camera in charge until something acquires a lock-on target,
 * then hands control to the state machine's follow state. Shake effects work
 * in BOTH modes — while the default camera runs, the shake offset is composed
 * onto its CFrame directly.
 */

import { Controller, type OnRender, type OnStart } from "@flamework/core";
import { Players, Workspace } from "@rbxts/services";
import {
	CameraStateMachine,
	CinematicState,
	FixedState,
	FollowState,
	FreeCamState,
	OrbitState,
	type CinematicStateContext,
	type FollowStateContext,
	type ShakePresetName,
} from "@trembus/camera";

@Controller()
export class CameraController implements OnStart, OnRender {
	private camera?: Camera;
	private stateMachine = new CameraStateMachine();
	private followState = new FollowState();
	private usingCustomCamera = false;

	onStart(): void {
		this.camera = Workspace.CurrentCamera;
		if (!this.camera) return;

		this.stateMachine.initialize(this.camera);
		this.stateMachine.registerState(this.followState);
		this.stateMachine.registerState(new FixedState());
		this.stateMachine.registerState(new OrbitState());
		this.stateMachine.registerState(new CinematicState());
		this.stateMachine.registerState(new FreeCamState());

		// Re-arm the default camera on spawn and respawn.
		const player = Players.LocalPlayer;
		if (player.Character) this.useDefaultCamera();
		player.CharacterAdded.Connect(() => this.useDefaultCamera());
	}

	onRender(dt: number): void {
		if (this.usingCustomCamera) {
			this.stateMachine.update(dt);
		} else if (this.camera && this.stateMachine.isShaking()) {
			// Default camera is driving — compose the shake offset on top.
			const offset = this.stateMachine.getShakeManager().update(dt);
			this.camera.CFrame = this.camera.CFrame.mul(offset);
		}
	}

	/** Lock the camera onto a target (e.g. from a targeting system). */
	lockOnTo(target: Model | BasePart): void {
		const character = Players.LocalPlayer.Character;
		if (!character) return;

		if (!this.usingCustomCamera) {
			const context: FollowStateContext = {
				target: character,
				offset: new Vector3(0, 8, -12),
				smoothing: 0.15,
			};
			this.stateMachine.setState("follow", context);
			this.usingCustomCamera = true;
		}
		this.followState.setFocusTarget(target);
	}

	/** Release the lock and hand the camera back to Roblox. */
	clearLockOn(): void {
		if (!this.usingCustomCamera || !this.camera) return;
		this.followState.setFocusTarget(undefined);
		this.usingCustomCamera = false;

		this.camera.CameraType = Enum.CameraType.Custom;
		this.useDefaultCamera();
	}

	/** Play a scripted camera sequence, then return to the default camera. */
	playCinematic(context: CinematicStateContext): void {
		this.usingCustomCamera = true;
		this.stateMachine.setState("cinematic", context);
	}

	/** Trigger a shake preset — works in default and custom camera modes. */
	shake(preset: ShakePresetName, sustainTime?: number): void {
		this.stateMachine.shakePreset(preset, sustainTime);
	}

	private useDefaultCamera(): void {
		if (!this.camera) return;
		const humanoid = Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
		if (humanoid) this.camera.CameraSubject = humanoid;
		this.usingCustomCamera = false;
	}
}
