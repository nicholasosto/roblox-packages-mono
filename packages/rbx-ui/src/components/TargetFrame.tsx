/**
 * TargetFrame — Top-right HUD element showing target name, level, health
 *
 * Molecule-level component. Mirrors PlayerFrame layout but right-aligned
 * with a health bar.
 */
import React from "@rbxts/react";
import { BG, BORDER, FONTS, FONT_SIZE, RADII, SIGNAL, SPACING, STAT, TEXT } from "../design-system/Tokens";
import type { CombatEntityData } from "../types";

export interface TargetFrameProps {
	target: CombatEntityData;
}

export default function TargetFrame(props: TargetFrameProps) {
	const hp = props.target.resources.find((r) => r.id === "hp");
	const hpFraction = hp && hp.max > 0 ? math.clamp(hp.current / hp.max, 0, 1) : 0;

	return (
		<frame
			Size={new UDim2(0, 240, 0, 60)}
			BackgroundColor3={BG.surface}
			BackgroundTransparency={0.15}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.lg)} />
			<uistroke Color={SIGNAL.c500} Thickness={1} Transparency={0.5} />
			<uipadding
				PaddingLeft={new UDim(0, SPACING[3])}
				PaddingRight={new UDim(0, SPACING[3])}
				PaddingTop={new UDim(0, SPACING[2])}
				PaddingBottom={new UDim(0, SPACING[2])}
			/>

			{/* Name + level row */}
			<frame Size={new UDim2(1, 0, 0, 18)} BackgroundTransparency={1}>
				<textlabel
					Text={props.target.name}
					FontFace={FONTS.display}
					TextSize={FONT_SIZE.sm}
					TextColor3={SIGNAL.c400}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextTruncate={Enum.TextTruncate.AtEnd}
					Size={new UDim2(0.7, 0, 1, 0)}
					BackgroundTransparency={1}
				/>
				<textlabel
					Text={`Lv. ${props.target.level}`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.xs}
					TextColor3={TEXT.secondary}
					TextXAlignment={Enum.TextXAlignment.Right}
					Size={new UDim2(0.3, 0, 1, 0)}
					Position={new UDim2(0.7, 0, 0, 0)}
					BackgroundTransparency={1}
				/>
			</frame>

			{/* Health bar */}
			<frame
				Size={new UDim2(1, 0, 0, 14)}
				Position={new UDim2(0, 0, 0, 24)}
				BackgroundColor3={BG.elevated}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, RADII.sm)} />
				<frame
					Size={new UDim2(hpFraction, 0, 1, 0)}
					BackgroundColor3={STAT.health}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, RADII.sm)} />
				</frame>
			</frame>

			{/* HP text */}
			{hp && (
				<textlabel
					Text={`${hp.current} / ${hp.max}`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.xs}
					TextColor3={TEXT.secondary}
					TextXAlignment={Enum.TextXAlignment.Right}
					Size={new UDim2(1, 0, 0, 12)}
					Position={new UDim2(0, 0, 0, 38)}
					BackgroundTransparency={1}
				/>
			)}
		</frame>
	);
}
