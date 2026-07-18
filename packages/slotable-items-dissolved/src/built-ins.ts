// ─── Slotable Items: Built-in Item Kinds (dogfood the registry) ───────────────
//
// Registers the five built-in item kinds through the SAME public registerItemKind API a
// game uses for custom kinds. Imported for side-effect by index.ts so the built-ins are
// present at module load (mirrors slot-category-registry's self-registration of the five
// built-in categories). The existing typed factories are wired in unchanged.

import { registerItemKind } from "./item-kind-registry";
import type { ModifierContribution } from "./modifier-types";
import type { StatModifiers } from "./types";
import type { EquipmentItemInstance } from "./equipment-types";
import { createEquipmentInstance, migrateEquipmentInstance } from "./equipment-types";
import type { EquipmentCatalogEntry } from "./equipment-types";
import { createAccessoryInstance } from "./accessory-types";
import type { AccessoryCatalogEntry, AccessoryItemInstance } from "./accessory-types";
import { createSoulGemInstance } from "./soul-gem-types";
import type { SoulGemCatalogEntry, SoulGemItemInstance } from "./soul-gem-types";
import { createAbilityInstance } from "./ability-types";
import type { AbilityCatalogEntry, AbilityItemInstance } from "./ability-types";
import { createConsumableInstance } from "./consumable-types";
import type { ConsumableCatalogEntry, ConsumableItemInstance } from "./consumable-types";

/** Flat StatModifiers → additive contributions in a given scope. Shared by the kinds that
 *  grant stats through a `modifiers` map (Equipment, Accessory, SoulGem). */
function modifiersToContributions(
  modifiers: StatModifiers | undefined,
  scope: string,
  sourceGuid: string,
): ModifierContribution[] {
  const out: ModifierContribution[] = [];
  if (modifiers === undefined) return out;
  for (const [stat, value] of pairs(modifiers)) {
    if (value !== undefined) out.push({ stat, value, op: "add", scope, sourceGuid });
  }
  return out;
}

registerItemKind<EquipmentCatalogEntry, EquipmentItemInstance>({
  kind: "Equipment",
  defaultSlotCategory: "Equipment",
  createInstance: createEquipmentInstance,
  reviveInstance: (raw) =>
    migrateEquipmentInstance(raw as Partial<EquipmentItemInstance> & { guid: string; catalogId: string }),
  contributeModifiers: (inst, entry) => modifiersToContributions(entry.modifiers, "Equipment", inst.guid),
  capabilities: ["StatModifiable", "PassiveGranting", "AbilityGranting"],
});

registerItemKind<AccessoryCatalogEntry, AccessoryItemInstance>({
  kind: "Accessory",
  defaultSlotCategory: "Accessory",
  createInstance: createAccessoryInstance,
  contributeModifiers: (inst, entry) => modifiersToContributions(entry.modifiers, "Accessory", inst.guid),
  capabilities: ["StatModifiable", "PassiveGranting", "AbilityGranting"],
});

registerItemKind<SoulGemCatalogEntry, SoulGemItemInstance>({
  kind: "SoulGem",
  defaultSlotCategory: "SoulGem",
  createInstance: createSoulGemInstance,
  contributeModifiers: (inst, entry) => modifiersToContributions(entry.modifiers, "SoulGem", inst.guid),
  capabilities: ["StatModifiable", "AbilityGranting"],
});

registerItemKind<AbilityCatalogEntry, AbilityItemInstance>({
  kind: "Ability",
  defaultSlotCategory: "Ability",
  createInstance: createAbilityInstance,
  capabilities: [],
});

registerItemKind<ConsumableCatalogEntry, ConsumableItemInstance>({
  kind: "Consumable",
  defaultSlotCategory: "Consumable",
  createInstance: createConsumableInstance,
  stacking: { maxStackSize: 99 },
  capabilities: ["Stackable"],
});
