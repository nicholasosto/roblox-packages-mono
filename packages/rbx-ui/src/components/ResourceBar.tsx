/**
 * ResourceBar — Horizontal bar showing current/max for a resource (HP, MP, SP)
 *
 * Atom-level component. Renders a colored fill bar with label and numeric value.
 */
import React from "@rbxts/react";
import { BG, BORDER, FONTS, FONT_SIZE, RADII, SPACING, STAT, TEXT } from "../design-system/Tokens";

export interface ResourceBarProps {
	label: string;
	current: number;
	max: number;
	color: "health" | "mana" | "stamina";
	height?: number;
}

const COLOR_MAP = {
	health: STAT.health,
	mana: STAT.mana,
	stamina: STAT.stamina,
};

export default function ResourceBar(props: ResourceBarProps) {
	const barHeight = props.height ?? 20;
	const fillFraction = props.max > 0 ? math.clamp(props.current / props.max, 0, 1) : 0;
	const barColor = COLOR_MAP[props.color];

	return (
		<frame
			Size={new UDim2(1, 0, 0, barHeight + 14)}
			BackgroundTransparency={1}
		>
			{/* Label row */}
			<frame
				Size={new UDim2(1, 0, 0, 14)}
				BackgroundTransparency={1}
			>
				<textlabel
					Text={props.label}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.xs}
					TextColor3={TEXT.secondary}
					TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(0.5, 0, 1, 0)}
					BackgroundTransparency={1}
				/>
				<textlabel
					Text={`${props.current}/${props.max}`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.xs}
					TextColor3={TEXT.primary}
					TextXAlignment={Enum.TextXAlignment.Right}
					Size={new UDim2(0.5, 0, 1, 0)}
					Position={new UDim2(0.5, 0, 0, 0)}
					BackgroundTransparency={1}
				/>
			</frame>

			{/* Bar track */}
			<frame
				Size={new UDim2(1, 0, 0, barHeight)}
				Position={new UDim2(0, 0, 0, 14)}
				BackgroundColor3={BG.elevated}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, RADII.sm)} />
				<uistroke Color={BORDER.subtle} Thickness={1} />

				{/* Fill */}
				<frame
					Size={new UDim2(fillFraction, 0, 1, 0)}
					BackgroundColor3={barColor}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, RADII.sm)} />
				</frame>
			</frame>
		</frame>
	);
}
