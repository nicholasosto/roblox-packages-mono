// ─── Mount seat behavior — VehicleSeat + network ownership handoff ──────────
//
// Brain rules:
//   1. On Occupant change to the owning player, call SetNetworkOwner(player)
//      so steering inputs have zero round-trip latency.
//   2. On dismount, call SetNetworkOwnershipAuto() explicitly — do not rely
//      on default behavior.
//   3. Validate occupant is the expected owner before handoff. A non-owner
//      sitting in the seat (e.g. via exploit) does NOT receive ownership.
//
// Provides a minimal driver loop: VehicleSeat.Throttle/Steer drive the
// mount Humanoid's MoveDirection. Games that need fancier handling can
// disable the driver and wire their own input pipeline.
// ─────────────────────────────────────────────────────────────────────────────

import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { Logger } from "@trembus/logger";
import { LOG_TAG } from "./constants";

const logger = Logger.create(LOG_TAG);

export interface SeatBinding {
	readonly seat: VehicleSeat;
	readonly mounted: Signal<(player: Player) => void>;
	readonly dismounted: Signal<(player: Player) => void>;
	/** Tear down: disconnect events, restore network ownership. */
	destroy(): void;
}

function getAssemblyRoot(rig: Model): BasePart | undefined {
	const primary = rig.PrimaryPart;
	if (primary) return primary;
	const root = rig.FindFirstChild("HumanoidRootPart");
	return root && root.IsA("BasePart") ? root : undefined;
}

function findOrCreateSeat(rig: Model, rigRoot: BasePart, seatOffset: Vector3): VehicleSeat {
	const existing = rig.FindFirstChildWhichIsA("VehicleSeat", true);
	if (existing) return existing;

	const seat = new Instance("VehicleSeat");
	seat.Name = "MountSeat";
	seat.Size = new Vector3(2, 1, 2);
	seat.Transparency = 1;
	seat.CanCollide = false;
	seat.Anchored = false;
	seat.Massless = true;
	seat.CFrame = rigRoot.CFrame.mul(new CFrame(seatOffset));
	seat.Parent = rig;

	const weld = new Instance("WeldConstraint");
	weld.Part0 = rigRoot;
	weld.Part1 = seat;
	weld.Parent = seat;

	return seat;
}

function findRigHumanoid(rig: Model): Humanoid | undefined {
	return rig.FindFirstChildWhichIsA("Humanoid");
}

/**
 * Wire VehicleSeat occupant handling on the rig.
 *
 * The returned binding owns a Heartbeat driver loop that translates
 * `seat.Throttle` / `seat.Steer` into a MoveDirection on the rig's Humanoid.
 * Call `destroy()` on dismiss to release the connection.
 */
export function attachSeat(
	rig: Model,
	seatOffset: Vector3,
	baseWalkSpeed: number,
	expectedOwnerUserId: number,
): SeatBinding {
	const rigRoot = getAssemblyRoot(rig);
	if (!rigRoot) {
		error(`[${LOG_TAG}] Mount rig "${rig.Name}" has no PrimaryPart or HumanoidRootPart`);
	}
	const seat = findOrCreateSeat(rig, rigRoot, seatOffset);
	const rigHumanoid = findRigHumanoid(rig);
	if (rigHumanoid) {
		rigHumanoid.WalkSpeed = baseWalkSpeed;
	} else {
		logger.warn(`attachSeat: rig "${rig.Name}" has no Humanoid — movement driver disabled`);
	}

	const mountedSignal = new Signal<(player: Player) => void>();
	const dismountedSignal = new Signal<(player: Player) => void>();

	let currentOwner: Player | undefined;

	const handleOccupantChange = () => {
		const occupant = seat.Occupant;
		if (occupant) {
			const character = occupant.Parent as Model | undefined;
			const player = character ? Players.GetPlayerFromCharacter(character) : undefined;
			if (!player) return;

			if (player.UserId !== expectedOwnerUserId) {
				logger.warn(
					`attachSeat: ${player.Name} (${player.UserId}) sat in seat owned by ${expectedOwnerUserId} — ownership handoff skipped`,
				);
				return;
			}

			currentOwner = player;
			pcall(() => rigRoot.SetNetworkOwner(player));
			mountedSignal.Fire(player);
			logger.debug(`Mount occupied by ${player.Name}; network ownership handed off`);
		} else if (currentOwner) {
			const player = currentOwner;
			currentOwner = undefined;
			pcall(() => rigRoot.SetNetworkOwnershipAuto());
			dismountedSignal.Fire(player);
			logger.debug(`Mount vacated by ${player.Name}; network ownership reset to auto`);
		}
	};

	const occupantConn = seat
		.GetPropertyChangedSignal("Occupant")
		.Connect(handleOccupantChange);

	// Driver loop — translate Throttle/Steer to Humanoid:Move()
	let driverConn: RBXScriptConnection | undefined;
	if (rigHumanoid) {
		driverConn = RunService.Heartbeat.Connect(() => {
			if (!seat.Occupant) return;
			const throttle = seat.ThrottleFloat;
			const steer = seat.SteerFloat;
			if (throttle === 0 && steer === 0) {
				rigHumanoid.Move(new Vector3(0, 0, 0), false);
				return;
			}
			const seatLook = seat.CFrame.LookVector;
			const seatRight = seat.CFrame.RightVector;
			const moveDir = seatLook.mul(-throttle).add(seatRight.mul(steer));
			rigHumanoid.Move(moveDir, false);
		});
	}

	return {
		seat,
		mounted: mountedSignal,
		dismounted: dismountedSignal,
		destroy() {
			occupantConn.Disconnect();
			driverConn?.Disconnect();
			mountedSignal.Destroy();
			dismountedSignal.Destroy();
			if (currentOwner) {
				pcall(() => rigRoot.SetNetworkOwnershipAuto());
				currentOwner = undefined;
			}
		},
	};
}

/** Eject the current occupant from a seat (no-op if empty). */
export function ejectSeat(seat: VehicleSeat): boolean {
	const occupant = seat.Occupant;
	if (!occupant) return false;
	const [ok] = pcall(() => occupant.Sit = false);
	return ok;
}
