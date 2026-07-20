import { Players, Workspace } from '@rbxts/services';
import { enqueue } from '../http/client';
import { registerPoll } from '../util/polling';

const STATE_INTERVAL = 5;

function collectState(): void {
  const players = Players.GetPlayers().map((p) => ({
    name: p.Name,
    userId: p.UserId,
    hasCharacter: p.Character !== undefined,
  }));

  const zones: string[] = [];
  const zonesFolder = Workspace.FindFirstChild('Zones');
  if (zonesFolder) {
    for (const child of zonesFolder.GetChildren()) {
      zones.push(child.Name);
    }
  }

  const npcsFolder = Workspace.FindFirstChild('NPCs');
  const entityCount = npcsFolder ? npcsFolder.GetChildren().size() : 0;

  enqueue({
    channel: 'state',
    timestamp: os.time(),
    data: {
      playerCount: Players.GetPlayers().size(),
      players,
      serverUptime: math.floor(Workspace.DistributedGameTime),
      loadedZones: zones,
      activeEntityCount: entityCount,
    },
  });
}

/** Register game state polling at 5-second intervals. */
export function startGameStateChannel(): void {
  registerPoll(STATE_INTERVAL, collectState);
}
