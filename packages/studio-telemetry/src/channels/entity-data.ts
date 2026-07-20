import { Workspace } from '@rbxts/services';
import { enqueue } from '../http/client';
import { registerPoll } from '../util/polling';

const ENTITY_INTERVAL = 10;

function collectEntities(): void {
  const npcsFolder = Workspace.FindFirstChild('NPCs');
  if (!npcsFolder) {
    enqueue({
      channel: 'entities',
      timestamp: os.time(),
      data: { npcs: [] },
    });
    return;
  }

  const npcs: Array<{
    name: string;
    position: [number, number, number];
    health: number;
    maxHealth: number;
  }> = [];

  for (const child of npcsFolder.GetChildren()) {
    if (!child.IsA('Model')) continue;

    const primaryPart = child.PrimaryPart;
    const pos: [number, number, number] = primaryPart
      ? [
          math.floor(primaryPart.Position.X * 10) / 10,
          math.floor(primaryPart.Position.Y * 10) / 10,
          math.floor(primaryPart.Position.Z * 10) / 10,
        ]
      : [0, 0, 0];

    const humanoid = child.FindFirstChildOfClass('Humanoid');
    npcs.push({
      name: child.Name,
      position: pos,
      health: humanoid ? math.floor(humanoid.Health) : 0,
      maxHealth: humanoid ? math.floor(humanoid.MaxHealth) : 0,
    });
  }

  enqueue({
    channel: 'entities',
    timestamp: os.time(),
    data: { npcs },
  });
}

/** Register entity data polling at 10-second intervals. */
export function startEntityDataChannel(): void {
  registerPoll(ENTITY_INTERVAL, collectEntities);
}
