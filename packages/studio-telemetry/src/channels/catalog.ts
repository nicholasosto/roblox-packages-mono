import { ReplicatedStorage } from '@rbxts/services';
import { enqueue } from '../http/client';
import { registerPoll } from '../util/polling';
import type { CatalogEntry, KitInfo, ManifestInfo } from '../types/messages';

// The ledger changes at human/agent editing speed, not frame speed — a slow poll is plenty.
const CATALOG_INTERVAL = 30;

function attrString(inst: Instance, name: string): string | undefined {
  const v = inst.GetAttribute(name);
  return typeIs(v, 'string') ? v : undefined;
}

function attrNumber(inst: Instance, name: string): number | undefined {
  const v = inst.GetAttribute(name);
  return typeIs(v, 'number') ? v : undefined;
}

/**
 * Snapshot the decision-0008 in-place ledger: UIStudio.Catalog entry attributes,
 * the UIMockups kit inventory, and every GenerationManifest value. All lookups are
 * FindFirstChild-guarded — in a place without the ledger (e.g. Part Textures) this
 * posts empty arrays, which is an honest "no catalog here".
 */
function collectCatalog(): void {
  const catalog: CatalogEntry[] = [];
  const kits: KitInfo[] = [];
  const manifests: ManifestInfo[] = [];

  const uiStudio = ReplicatedStorage.FindFirstChild('UIStudio');
  const catalogFolder = uiStudio?.FindFirstChild('Catalog');
  if (catalogFolder) {
    for (const entry of catalogFolder.GetChildren()) {
      catalog.push({
        name: entry.Name,
        component: attrString(entry, 'Component'),
        state: attrString(entry, 'State'),
        sourceGuiPath: attrString(entry, 'SourceGuiPath'),
        variants: attrString(entry, 'Variants'),
        generatedBy: attrString(entry, 'GeneratedBy'),
        harnessVersion: attrNumber(entry, 'HarnessVersion'),
        templates: entry.GetChildren().size(),
      });
    }
  }

  const mockups = ReplicatedStorage.FindFirstChild('UIMockups');
  if (mockups) {
    for (const kit of mockups.GetChildren()) {
      const manifest = kit.FindFirstChild('GenerationManifest');
      const hasManifest = manifest !== undefined && manifest.IsA('StringValue');
      kits.push({
        name: kit.Name,
        className: kit.ClassName,
        descendants: kit.GetDescendants().size(),
        hasManifest,
      });
      if (hasManifest) {
        manifests.push({
          path: `ReplicatedStorage.UIMockups.${kit.Name}.GenerationManifest`,
          value: (manifest as StringValue).Value,
        });
      }
    }
  }

  enqueue({
    channel: 'catalog',
    timestamp: os.time(),
    data: { place: game.Name, placeId: game.PlaceId, catalog, kits, manifests },
  });
}

/** Send one ledger snapshot immediately on load, then poll at 30-second intervals. */
export function startCatalogChannel(): void {
  collectCatalog();
  registerPoll(CATALOG_INTERVAL, collectCatalog);
}
