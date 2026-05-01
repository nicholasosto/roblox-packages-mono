import React from "@rbxts/react";
import { INTENT_COLORS, FONTS, FONT_SIZE, RADII, SPACING } from "../design-system/Tokens";
import { getIntent } from "../design-system/StatusIntentMap";

interface StatusBadgeProps {
	status: string;
	size?: "sm" | "md";
}

/**
 * StatusBadge — Cross-platform component (Roblox implementation)
 *
 * Compact status indicator with colored background, border, and uppercase label.
 * Visually matches the web StatusBadge in @trembus/ui-library.
 *
 * Web equivalent: packages/ui-library/src/components/StatusBadge.tsx
 */
function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
	const intent = getIntent(status);
	const colors = INTENT_COLORS[intent];
	const fontSize = size === "sm" ? FONT_SIZE.xs : FONT_SIZE.sm;
	const px = SPACING[2]; // 8px — matches web px-2
	const py = size === "sm" ? 2 : 4; // matches web py-0.5 / py-1

	return (
		<frame
			AutomaticSize={Enum.AutomaticSize.XY}
			BackgroundColor3={colors.bg.color}
			BackgroundTransparency={colors.bg.transparency}
			BorderSizePixel={0}
			Size={UDim2.fromOffset(0, 0)}
		>
			<uicorner CornerRadius={new UDim(0, RADII.md)} />
			<uistroke
				Color={colors.border.color}
				Transparency={colors.border.transparency}
				Thickness={1}
			/>
			<uipadding
				PaddingLeft={new UDim(0, px)}
				PaddingRight={new UDim(0, px)}
				PaddingTop={new UDim(0, py)}
				PaddingBottom={new UDim(0, py)}
			/>
			<textlabel
				AutomaticSize={Enum.AutomaticSize.XY}
				BackgroundTransparency={1}
				Text={string.upper(status)}
				TextColor3={colors.text}
				FontFace={FONTS.mono}
				TextSize={fontSize}
				Size={UDim2.fromOffset(0, 0)}
			/>
		</frame>
	);
}

export default StatusBadge;
