// ─── @trembus/slotable-items: Barrel Exports ─────────────────────────────────

// ── Foundation Types ─────────────────────────────────────────────────────────
export {
  ITEM_RARITY_KEYS,
  type ItemRarityKey,
  type UIDisplayMeta,
  type StatModifiers,
} from './types';

// ── Slot System ──────────────────────────────────────────────────────────────
export {
  SLOT_CATEGORY_KEYS,
  type SlotCategoryKey,
  EQUIPMENT_SLOT_KEYS,
  type EquipmentSlotKey,
  ACCESSORY_SLOT_KEYS,
  type AccessorySlotKey,
  SOUL_GEM_SLOT_KEYS,
  type SoulGemSlotKey,
  ABILITY_SLOT_KEYS,
  type AbilitySlotKey,
  CONSUMABLE_SLOT_KEYS,
  type ConsumableSlotKey,
  ALL_SLOT_TYPE_KEYS,
  type UniversalSlotTypeKey,
  getSlotCategory,
  isStrictSlotType,
  isItemCompatibleWithSlot,
  getCompatibleSlots,
} from './slot-types';

// ── Base Item Types ──────────────────────────────────────────────────────────
export {
  RARITY_SORT_ORDER,
  type StatModifiable,
  type PassiveGranting,
  type AbilityGranting,
  type Stackable,
  type BaseSlotableCatalogEntry,
  type BaseSlotableInstance,
  type SlotDragPayload,
  type SlotDropResult,
  type SlotDropFailureReason,
  canItemFitInSlot,
  getSlotCategoryFromSlotType,
  hasStatModifiers,
  hasPassiveEffects,
  hasGrantedAbilities,
  isStackable,
} from './base-types';

// ── Equipment ────────────────────────────────────────────────────────────────
export {
  type WeaponType,
  type ArmorType,
  type PassiveEffectType,
  type PassiveEffectConfig,
  type SetBonusTier,
  type EquipmentSetDefinition,
  type EquipmentCatalogEntry,
  type EquipmentItemInstance,
  type EquipmentLoadout,
  DEFAULT_EQUIPMENT_LOADOUT,
  createEquipmentInstance,
  migrateEquipmentInstance,
} from './equipment-types';

// ── Accessories ──────────────────────────────────────────────────────────────
export {
  type AccessoryType,
  type AccessoryCatalogEntry,
  type AccessoryItemInstance,
  type AccessoryLoadout,
  DEFAULT_ACCESSORY_LOADOUT,
  createAccessoryInstance,
} from './accessory-types';

// ── Consumables ──────────────────────────────────────────────────────────────
export {
  type InstantEffectType,
  type InstantEffectConfig,
  type TemporaryBuffConfig,
  type ConsumableCatalogEntry,
  type ConsumableItemInstance,
  type ConsumableLoadout,
  DEFAULT_CONSUMABLE_LOADOUT,
  createConsumableInstance,
  addToConsumableStack,
  removeFromConsumableStack,
} from './consumable-types';

// ── Abilities ────────────────────────────────────────────────────────────────
export {
  type AbilityTargetingMode,
  type AbilityTargetingConfig,
  type AbilityEffectType,
  type AbilityEffect,
  type AbilitySchool,
  type AbilityCatalogEntry,
  type AbilityItemInstance,
  type AbilityLoadout,
  type AbilityInstanceLoadout,
  DEFAULT_ABILITY_LOADOUT,
  DEFAULT_ABILITY_INSTANCE_LOADOUT,
  createAbilityInstance,
} from './ability-types';

// ── Soul Gems ────────────────────────────────────────────────────────────────
export {
  type SoulGemAcquisitionSource,
  type SoulGemEffectType,
  type RegenerativeShieldConfig,
  type LifeStealConfig,
  type DamageReflectConfig,
  type MovementBoostConfig,
  type ResourceRegenConfig,
  type CriticalEnhanceConfig,
  type DamageReductionConfig,
  type OnHitProcConfig,
  type SoulGemPassiveConfig,
  type SoulGemCatalogEntry,
  type SoulGemItemInstance,
  type SoulGemLoadout,
  DEFAULT_SOUL_GEM_LOADOUT,
  type RegenerativeShieldState,
  type SoulGemActiveEffects,
  createSoulGemInstance,
  getUnlockedSoulGemSlots,
} from './soul-gem-types';

// ── Unified Inventory ────────────────────────────────────────────────────────
export {
  type AnySlotableInstance,
  type AnySlotableCatalogEntry,
  type UnifiedLoadout,
  DEFAULT_UNIFIED_LOADOUT,
  type UnifiedInventorySnapshot,
  DEFAULT_UNIFIED_INVENTORY,
  findItemByGuid,
  getItemsByCategory,
  countTotalItems,
  validateDragDrop,
  type InventoryOperationType,
  type InventoryOperationResult,
} from './inventory';

// ── Persistence Slice ───────────────────────────────────────────────────────
export {
  type InventorySliceData,
  INVENTORY_PERSISTENCE_SLICE,
} from './persistence';

// ── Operations ───────────────────────────────────────────────────────────────
export {
  type LoadoutOperationFailureReason,
  type LoadoutOperationResultBase,
  type EquipItemRequest,
  type EquipItemResult,
  type UnequipSlotRequest,
  type UnequipSlotResult,
  type SwapSlotsRequest,
  type SwapSlotsResult,
  type GrantItemRequest,
  type GrantItemResult,
  type RemoveItemRequest,
  type RemoveItemResult,
  type ActivateSlotRequest,
  type ActivateSlotResult,
  type UnifiedInventorySyncPayload,
  type SlotUpdatePayload,
  type AnyLoadoutOperationResult,
  type LoadoutOperationType,
} from './operations';
