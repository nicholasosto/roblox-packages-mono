// ─── Pet follow behavior — physics-based, NOT Humanoid:MoveTo ───────────────
//
// Brain-scar: Humanoid:MoveTo has an 8-second hard timeout and chops cleanly
// when the target is too far. AlignPosition + AlignOrientation gives smooth,
// tunable following without manual repath chaining.
//
// Two attachments per binding:
//   - petAttachment on pet's HumanoidRootPart
//   - ownerAttachment on owner's HumanoidRootPart, offset by followConfig.offset
//
// The binding rebuilds attachments when the owner respawns (CharacterAdded).
// ─────────────────────────────────────────────────────────────────────────────

import { Logger } from "@trembus/logger";
import { LOG_TAG } from "./constants";
import type { FollowConfig } from "./types";

const logger = Logger.create(LOG_TAG);

export interface FollowBinding {
	/** Tear down constraints and stop respawn-rebind. */
	destroy(): void;
}

function buildConstraints(
	petRoot: BasePart,
	ownerRoot: BasePart,
	config: FollowConfig,
): { dispose: () => void } {
	const petAttachment = new Instance("Attachment");
	petAttachment.Name = "PetFollowAttachment";
	petAttachment.Parent = petRoot;

	const ownerAttachment = new Instance("Attachment");
	ownerAttachment.Name = "PetFollowTarget";
	ownerAttachment.CFrame = new CFrame(config.offset);
	ownerAttachment.Parent = ownerRoot;

	const alignPos = new Instance("AlignPosition");
	alignPos.Name = "PetFollowAlignPosition";
	alignPos.Attachment0 = petAttachment;
	alignPos.Attachment1 = ownerAttachment;
	alignPos.MaxForce = config.maxForce;
	alignPos.Responsiveness = config.responsiveness;
	alignPos.RigidityEnabled = false;
	alignPos.ReactionForceEnabled = false;
	alignPos.Parent = petRoot;

	const alignOri = new Instance("AlignOrientation");
	alignOri.Name = "PetFollowAlignOrientation";
	alignOri.Attachment0 = petAttachment;
	alignOri.Attachment1 = ownerAttachment;
	alignOri.MaxTorque = config.maxForce;
	alignOri.Responsiveness = config.responsiveness;
	alignOri.RigidityEnabled = false;
	alignOri.ReactionTorqueEnabled = false;
	alignOri.Parent = petRoot;

	return {
		dispose: () => {
			alignPos.Destroy();
			alignOri.Destroy();
			petAttachment.Destroy();
			ownerAttachment.Destroy();
		},
	};
}

function getHumanoidRootPart(character: Model): BasePart | undefined {
	const part = character.FindFirstChild("HumanoidRootPart");
	return part && part.IsA("BasePart") ? part : undefined;
}

/**
 * Wire a pet's HumanoidRootPart to follow the owner's HumanoidRootPart via
 * AlignPosition + AlignOrientation. Rebinds automatically when the owner
 * respawns. Includes a teleport-catchup loop for when the pet falls behind.
 */
export function attachFollow(
	pet: Model,
	petRoot: BasePart,
	owner: Player,
	config: FollowConfig,
): FollowBinding {
	let alive = true;
	let current: { dispose: () => void } | undefined;

	const bindToCharacter = (character: Model) => {
		const ownerRoot = getHumanoidRootPart(character);
		if (!ownerRoot) {
			logger.warn(`attachFollow: ${owner.Name} character has no HumanoidRootPart yet`);
			return;
		}
		current = buildConstraints(petRoot, ownerRoot, config);
	};

	if (owner.Character) {
		bindToCharacter(owner.Character);
	} else {
		logger.debug(`attachFollow: ${owner.Name} not spawned yet — waiting for CharacterAdded`);
	}

	const respawnConn = owner.CharacterAdded.Connect((character) => {
		if (!alive) return;
		current?.dispose();
		bindToCharacter(character);
	});

	const teleportLoop = task.spawn(() => {
		while (alive) {
			task.wait(0.5);
			const character = owner.Character;
			const ownerRoot = character ? getHumanoidRootPart(character) : undefined;
			if (!ownerRoot) continue;
			const dist = petRoot.Position.sub(ownerRoot.Position).Magnitude;
			if (dist > config.teleportDistance) {
				pet.PivotTo(new CFrame(ownerRoot.Position.add(config.offset)));
			}
		}
	});

	return {
		destroy() {
			alive = false;
			respawnConn.Disconnect();
			task.cancel(teleportLoop);
			current?.dispose();
			current = undefined;
		},
	};
}
