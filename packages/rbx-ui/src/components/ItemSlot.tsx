/**
 * ItemSlot — Grid cell for inventory items
 *
 * Atom-level component. Shows icon placeholder, rarity border, stack count.
 * Empty slots render as dim placeholders.
 */
import React, { useState } from "@rbxts/react";
import { BG, BORDER, FONTS, FONT_SIZE, RADII, TEXT } from "../design-system/Tokens";
import { type ItemRarity, RARITY_COLORS } from "../types";

export interface ItemSlotProps {
	icon?: string;
	rarity?: ItemRarity;
	stackCount?: number;
	selected?: boolean;
	onActivated?: () => void;
	size?: number;
}

export default function ItemSlot(props: ItemSlotProps) {
	const slotSize = props.size ?? 64;
	const isEmpty = props.icon === undefined;
	const [hovered, setHovered] = useState(false);

	const rarityRgb = props.rarity ? RARITY_COLORS[props.rarity] : undefined;

	const borderColor = props.selected && rarityRgb
		? Color3.fromRGB(rarityRgb.r, rarityRgb.g, rarityRgb.b)
		: rarityRgb
			? Color3.fromRGB(rarityRgb.r, rarityRgb.g, rarityRgb.b)
			: BORDER.subtle;

	const borderThickness = props.selected ? 2 : 1;

	return (
		<textbutton
			Text=""
			Size={new UDim2(0, slotSize, 0, slotSize)}
			BackgroundColor3={hovered ? BG.hover : isEmpty ? BG.deep : BG.elevated}
			BorderSizePixel={0}
			AutoButtonColor={false}
			Event={{
				Activated: () => props.onActivated?.(),
				MouseEnter: () => setHovered(true),
				MouseLeave: () => setHovered(false),
			}}
		>
			<uicorner CornerRadius={new UDim(0, RADII.md)} />
			<uistroke
				Color={borderColor}
				Thickness={borderThickness}
				Transparency={isEmpty ? 0.6 : 0}
			/>

			{/* Icon text */}
			{!isEmpty && (
				<textlabel
					Text={props.icon!}
					FontFace={FONTS.display}
					TextSize={FONT_SIZE.xl}
					TextColor3={TEXT.primary}
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
				/>
			)}

			{/* Stack count badge */}
			{props.stackCount !== undefined && props.stackCount > 1 && (
				<textlabel
					Text={`${props.stackCount}`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.xs}
					TextColor3={TEXT.primary}
					TextXAlignment={Enum.TextXAlignment.Right}
					TextYAlignment={Enum.TextYAlignment.Bottom}
					Size={new UDim2(1, -4, 1, -4)}
					Position={new UDim2(0, 2, 0, 2)}
					BackgroundTransparency={1}
				/>
			)}
		</textbutton>
	);
}
