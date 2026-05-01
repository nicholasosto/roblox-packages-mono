/**
 * InventoryPanel — Grid-based item browser with detail pane
 *
 * Screen-level component. Tab bar (Equipment/Consumables/Materials),
 * item grid, selected item detail, gold + weight bar.
 */
import React, { useState } from "@rbxts/react";
import { AMBER, BG, BORDER, FONTS, FONT_SIZE, RADII, SPACING, STAT, TEXT, withAlpha } from "../design-system/Tokens";
import { type ItemData, type ItemCategory, RARITY_COLORS } from "../types";
import ItemSlot from "../components/ItemSlot";

export interface InventoryPanelProps {
	items: ItemData[];
	gold: number;
	weight: { current: number; max: number };
	onItemSelect?: (itemId: string) => void;
	onEquip?: (itemId: string) => void;
	onDrop?: (itemId: string) => void;
}

type TabId = "equipment" | "consumable" | "material";

const TABS: { id: TabId; label: string }[] = [
	{ id: "equipment", label: "Equipment" },
	{ id: "consumable", label: "Consumables" },
	{ id: "material", label: "Materials" },
];

const GRID_COLS = 5;
const GRID_ROWS = 4;
const SLOT_SIZE = 56;
const SLOT_GAP = 6;
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS;

const EMPTY_KEYS: string[] = [];
for (let idx = 0; idx < TOTAL_SLOTS; idx++) {
	EMPTY_KEYS.push(`empty-${idx}`);
}

interface SlotData {
	slotKey: string;
	item: ItemData | undefined;
}

function buildSlots(items: ItemData[]): SlotData[] {
	const result: SlotData[] = [];
	for (let idx = 0; idx < TOTAL_SLOTS; idx++) {
		const item = idx < items.size() ? items[idx] : undefined;
		result.push({
			slotKey: item !== undefined ? item.id : EMPTY_KEYS[idx],
			item: item,
		});
	}
	return result;
}

export default function InventoryPanel(props: InventoryPanelProps) {
	const [activeTab, setActiveTab] = useState<TabId>("equipment");
	const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

	const filteredItems = props.items.filter((item) => item.category === activeTab);
	const selectedItem = selectedItemId !== undefined
		? props.items.find((item) => item.id === selectedItemId)
		: undefined;

	const slots = buildSlots(filteredItems);

	return (
		<frame
			Size={new UDim2(0, 560, 0, 420)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			BackgroundColor3={BG.surface}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.xl)} />
			<uistroke Color={BORDER.accent} Thickness={1} />
			<uipadding
				PaddingLeft={new UDim(0, SPACING[4])}
				PaddingRight={new UDim(0, SPACING[4])}
				PaddingTop={new UDim(0, SPACING[3])}
				PaddingBottom={new UDim(0, SPACING[3])}
			/>

			{/* Title */}
			<frame Size={new UDim2(1, 0, 0, 24)} BackgroundTransparency={1}>
				<frame Size={new UDim2(0, 3, 0, 20)} BackgroundColor3={AMBER.c500} BorderSizePixel={0} />
				<textlabel
					Text="INVENTORY" FontFace={FONTS.display} TextSize={FONT_SIZE.lg}
					TextColor3={TEXT.primary} TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(1, -12, 1, 0)} Position={new UDim2(0, 12, 0, 0)} BackgroundTransparency={1}
				/>
			</frame>

			{/* Tab Bar */}
			<frame Size={new UDim2(1, 0, 0, 28)} Position={new UDim2(0, 0, 0, 32)} BackgroundTransparency={1}>
				<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, SPACING[2])} SortOrder={Enum.SortOrder.LayoutOrder} />
				{TABS.map((tab) => {
					const isActive = tab.id === activeTab;
					return (
						<textbutton
							key={tab.id}
							Text={tab.label} FontFace={FONTS.mono} TextSize={FONT_SIZE.sm}
							TextColor3={isActive ? AMBER.c400 : TEXT.tertiary}
							Size={new UDim2(0, 100, 0, 28)}
							BackgroundColor3={isActive ? withAlpha(AMBER.c500, 0.15).color : BG.elevated}
							BackgroundTransparency={isActive ? withAlpha(AMBER.c500, 0.15).transparency : 0}
							BorderSizePixel={0} AutoButtonColor={false}
							Event={{ Activated: () => { setActiveTab(tab.id); setSelectedItemId(undefined); } }}
						>
							<uicorner CornerRadius={new UDim(0, RADII.md)} />
							{isActive && <uistroke Color={AMBER.c500} Thickness={1} Transparency={0.5} />}
						</textbutton>
					);
				})}
			</frame>

			{/* Content area: Grid + Detail */}
			<frame Size={new UDim2(1, 0, 0, 280)} Position={new UDim2(0, 0, 0, 70)} BackgroundTransparency={1}>

				{/* Item Grid */}
				<frame
					Size={new UDim2(0, GRID_COLS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP, 1, 0)}
					BackgroundTransparency={1}
				>
					<uigridlayout
						CellSize={new UDim2(0, SLOT_SIZE, 0, SLOT_SIZE)}
						CellPadding={new UDim2(0, SLOT_GAP, 0, SLOT_GAP)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>
					{slots.map((slot) => (
						<ItemSlot
							key={slot.slotKey}
							icon={slot.item?.icon}
							rarity={slot.item?.rarity}
							stackCount={slot.item?.stackCount}
							selected={slot.item !== undefined && slot.item.id === selectedItemId}
							onActivated={() => {
								if (slot.item !== undefined) {
									setSelectedItemId(slot.item.id);
									if (props.onItemSelect) props.onItemSelect(slot.item.id);
								}
							}}
							size={SLOT_SIZE}
						/>
					))}
				</frame>

				{/* Item Detail Pane */}
				<frame
					Size={new UDim2(0, 210, 1, 0)} Position={new UDim2(1, -210, 0, 0)}
					BackgroundColor3={BG.elevated} BackgroundTransparency={0.5} BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, RADII.lg)} />
					<uipadding
						PaddingLeft={new UDim(0, SPACING[3])} PaddingRight={new UDim(0, SPACING[3])}
						PaddingTop={new UDim(0, SPACING[3])} PaddingBottom={new UDim(0, SPACING[3])}
					/>

					{selectedItem !== undefined ? (
						<frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
							<textlabel
								Text={selectedItem.name} FontFace={FONTS.display} TextSize={FONT_SIZE.md}
								TextColor3={TEXT.primary} TextXAlignment={Enum.TextXAlignment.Left} TextWrapped={true}
								Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}
							/>
							<frame
								Size={new UDim2(0, 70, 0, 18)} Position={new UDim2(0, 0, 0, 24)}
								BackgroundColor3={Color3.fromRGB(RARITY_COLORS[selectedItem.rarity].r, RARITY_COLORS[selectedItem.rarity].g, RARITY_COLORS[selectedItem.rarity].b)}
								BackgroundTransparency={0.8} BorderSizePixel={0}
							>
								<uicorner CornerRadius={new UDim(0, RADII.sm)} />
								<textlabel
									Text={string.upper(selectedItem.rarity)} FontFace={FONTS.mono} TextSize={FONT_SIZE.xs}
									TextColor3={Color3.fromRGB(RARITY_COLORS[selectedItem.rarity].r, RARITY_COLORS[selectedItem.rarity].g, RARITY_COLORS[selectedItem.rarity].b)}
									Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}
								/>
							</frame>
							<textlabel
								Text={selectedItem.description} FontFace={FONTS.body} TextSize={FONT_SIZE.sm}
								TextColor3={TEXT.secondary} TextXAlignment={Enum.TextXAlignment.Left} TextYAlignment={Enum.TextYAlignment.Top}
								TextWrapped={true} Size={new UDim2(1, 0, 0, 60)} Position={new UDim2(0, 0, 0, 50)} BackgroundTransparency={1}
							/>
							{selectedItem.stats !== undefined && selectedItem.stats.size() > 0 && (
								<frame
									Size={new UDim2(1, 0, 0, selectedItem.stats.size() * 18)}
									Position={new UDim2(0, 0, 0, 116)} BackgroundTransparency={1}
								>
									<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 2)} SortOrder={Enum.SortOrder.LayoutOrder} />
									{selectedItem.stats.map((s, i) => (
										<frame key={`stat-${i}`} Size={new UDim2(1, 0, 0, 16)} BackgroundTransparency={1}>
											<textlabel Text={s.label} FontFace={FONTS.body} TextSize={FONT_SIZE.sm} TextColor3={TEXT.secondary} TextXAlignment={Enum.TextXAlignment.Left} Size={new UDim2(0.6, 0, 1, 0)} BackgroundTransparency={1} />
											<textlabel Text={s.value} FontFace={FONTS.mono} TextSize={FONT_SIZE.sm} TextColor3={STAT.positive} TextXAlignment={Enum.TextXAlignment.Right} Size={new UDim2(0.4, 0, 1, 0)} Position={new UDim2(0.6, 0, 0, 0)} BackgroundTransparency={1} />
										</frame>
									))}
								</frame>
							)}
							{selectedItem.equippable === true && (
								<frame Size={new UDim2(1, 0, 0, 32)} Position={new UDim2(0, 0, 1, -32)} BackgroundTransparency={1}>
									<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, SPACING[2])} SortOrder={Enum.SortOrder.LayoutOrder} />
									<textbutton
										Text="Equip" FontFace={FONTS.body} TextSize={FONT_SIZE.sm} TextColor3={BG.deep}
										Size={new UDim2(0.5, -4, 0, 28)} BackgroundColor3={AMBER.c500} BorderSizePixel={0} AutoButtonColor={false}
										Event={{ Activated: () => { if (props.onEquip && selectedItem) props.onEquip(selectedItem.id); } }}
									>
										<uicorner CornerRadius={new UDim(0, RADII.md)} />
									</textbutton>
									<textbutton
										Text="Drop" FontFace={FONTS.body} TextSize={FONT_SIZE.sm} TextColor3={TEXT.secondary}
										Size={new UDim2(0.5, -4, 0, 28)} BackgroundColor3={BG.surface} BorderSizePixel={0} AutoButtonColor={false}
										Event={{ Activated: () => { if (props.onDrop && selectedItem) props.onDrop(selectedItem.id); } }}
									>
										<uicorner CornerRadius={new UDim(0, RADII.md)} />
									</textbutton>
								</frame>
							)}
						</frame>
					) : (
						<textlabel
							Text="Select an item" FontFace={FONTS.body} TextSize={FONT_SIZE.md}
							TextColor3={TEXT.tertiary} Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}
						/>
					)}
				</frame>
			</frame>

			{/* Bottom Bar: Gold + Weight */}
			<frame Size={new UDim2(1, 0, 0, 24)} Position={new UDim2(0, 0, 1, -24)} BackgroundTransparency={1}>
				<textlabel
					Text={`Gold: ${props.gold}`} FontFace={FONTS.mono} TextSize={FONT_SIZE.sm}
					TextColor3={AMBER.c300} TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(0.5, 0, 1, 0)} BackgroundTransparency={1}
				/>
				<textlabel
					Text={`Weight: ${props.weight.current}/${props.weight.max}`} FontFace={FONTS.mono} TextSize={FONT_SIZE.sm}
					TextColor3={TEXT.secondary} TextXAlignment={Enum.TextXAlignment.Right}
					Size={new UDim2(0.5, 0, 1, 0)} Position={new UDim2(0.5, 0, 0, 0)} BackgroundTransparency={1}
				/>
			</frame>
		</frame>
	);
}
