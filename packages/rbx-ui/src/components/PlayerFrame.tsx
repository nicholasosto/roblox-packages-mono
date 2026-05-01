/**
 * PlayerFrame — Top-left HUD element showing player avatar, name, level
 *
 * Molecule-level component combining text labels with a level badge.
 */
import React from "@rbxts/react";
import { AMBER, BG, BORDER, FONTS, FONT_SIZE, RADII, SPACING, TEXT } from "../design-system/Tokens";

export interface PlayerFrameProps {
	name: string;
	level: number;
}

export default function PlayerFrame(props: PlayerFrameProps) {
	return (
		<frame
			Size={new UDim2(0, 220, 0, 52)}
			BackgroundColor3={BG.surface}
			BackgroundTransparency={0.15}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.lg)} />
			<uistroke Color={BORDER.subtle} Thickness={1} />
			<uipadding
				PaddingLeft={new UDim(0, SPACING[3])}
				PaddingRight={new UDim(0, SPACING[3])}
				PaddingTop={new UDim(0, SPACING[2])}
				PaddingBottom={new UDim(0, SPACING[2])}
			/>

			{/* Avatar placeholder */}
			<frame
				Size={new UDim2(0, 36, 0, 36)}
				BackgroundColor3={BG.elevated}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, RADII.md)} />
				<uistroke Color={AMBER.c500} Thickness={1} />
				<textlabel
					Text="K"
					FontFace={FONTS.display}
					TextSize={FONT_SIZE.lg}
					TextColor3={AMBER.c400}
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundTransparency={1}
				/>
			</frame>

			{/* Name + level */}
			<frame
				Size={new UDim2(1, -48, 1, 0)}
				Position={new UDim2(0, 48, 0, 0)}
				BackgroundTransparency={1}
			>
				<textlabel
					Text={props.name}
					FontFace={FONTS.display}
					TextSize={FONT_SIZE.sm}
					TextColor3={TEXT.primary}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextTruncate={Enum.TextTruncate.AtEnd}
					Size={new UDim2(1, 0, 0.5, 0)}
					BackgroundTransparency={1}
				/>
				<textlabel
					Text={`Lv. ${props.level}`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.xs}
					TextColor3={AMBER.c300}
					TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(1, 0, 0.5, 0)}
					Position={new UDim2(0, 0, 0.5, 0)}
					BackgroundTransparency={1}
				/>
			</frame>
		</frame>
	);
}
