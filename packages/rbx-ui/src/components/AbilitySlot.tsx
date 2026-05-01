/**
 * AbilitySlot — Square tile showing an ability icon, keybind, and cooldown overlay
 *
 * Atom-level component for the ability bar.
 */
import React from "@rbxts/react";
import { AMBER, BG, BORDER, FONTS, FONT_SIZE, RADII, TEXT } from "../design-system/Tokens";

export interface AbilitySlotProps {
	icon: string;
	keybind: string;
	cooldown: number;
	maxCooldown: number;
	name: string;
	size?: number;
}

export default function AbilitySlot(props: AbilitySlotProps) {
	const slotSize = props.size ?? 56;
	const onCooldown = props.cooldown > 0;
	const cooldownFraction = props.maxCooldown > 0 ? math.clamp(props.cooldown / props.maxCooldown, 0, 1) : 0;

	return (
		<frame
			Size={new UDim2(0, slotSize, 0, slotSize)}
			BackgroundColor3={onCooldown ? BG.deep : BG.elevated}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.lg)} />
			<uistroke
				Color={onCooldown ? BORDER.subtle : AMBER.c500}
				Thickness={onCooldown ? 1 : 2}
			/>

			{/* Icon text */}
			<textlabel
				Text={props.icon}
				FontFace={FONTS.display}
				TextSize={FONT_SIZE.lg}
				TextColor3={onCooldown ? TEXT.tertiary : TEXT.primary}
				Size={new UDim2(1, 0, 1, -16)}
				Position={new UDim2(0, 0, 0, 0)}
				BackgroundTransparency={1}
			/>

			{/* Cooldown overlay */}
			{onCooldown && (
				<frame
					Size={new UDim2(1, 0, cooldownFraction, 0)}
					AnchorPoint={new Vector2(0, 1)}
					Position={new UDim2(0, 0, 1, 0)}
					BackgroundColor3={BG.deep}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, RADII.lg)} />
				</frame>
			)}

			{/* Cooldown timer text */}
			{onCooldown && (
				<textlabel
					Text={`${math.ceil(props.cooldown)}s`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.sm}
					TextColor3={TEXT.secondary}
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
				/>
			)}

			{/* Keybind badge */}
			<textlabel
				Text={props.keybind}
				FontFace={FONTS.mono}
				TextSize={FONT_SIZE.xs}
				TextColor3={AMBER.c300}
				Size={new UDim2(1, 0, 0, 14)}
				Position={new UDim2(0, 0, 1, -14)}
				BackgroundTransparency={1}
			/>
		</frame>
	);
}
