/**
 * WindowPanel — Cross-platform component (Roblox implementation)
 *
 * A draggable window container with title bar, close button, content area,
 * and optional footer. Uses UIDragDetector for native drag support.
 *
 * Web equivalent: packages/ui-library/src/components/WindowPanel.tsx
 */
import React from "@rbxts/react";
import {
	BG,
	BORDER,
	TEXT,
	FONTS,
	FONT_SIZE,
	SPACING,
	RADII,
	AMBER,
	SIGNAL,
} from "../design-system/Tokens";

// ── Types ───────────────────────────────────────────────────

interface WindowPanelProps {
	title: string;
	accentColor?: Color3;
	size?: "sm" | "md" | "lg";
	visible?: boolean;
	draggable?: boolean;
	onClose?: () => void;
	footer?: React.ReactNode;
	children?: React.ReactNode;
}

// ── Size mapping ────────────────────────────────────────────

const SIZE_PX: Record<string, number> = {
	sm: 320,
	md: 480,
	lg: 640,
};

const TITLE_BAR_HEIGHT = 40;

// ── Main Component ──────────────────────────────────────────

function WindowPanel({
	title,
	accentColor = AMBER.c400,
	size = "md",
	visible = true,
	draggable = false,
	onClose,
	footer,
	children,
}: WindowPanelProps) {
	if (!visible) return undefined!;

	const width = SIZE_PX[size] ?? SIZE_PX.md;

	return (
		<frame
			AutomaticSize={Enum.AutomaticSize.Y}
			Size={UDim2.fromOffset(width, 0)}
			BackgroundColor3={BG.elevated}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.xl)} />
			<uistroke Color={BORDER.subtle} Thickness={1} />
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			{/* UIDragDetector — native Roblox drag, no custom code */}
			{draggable && (
				<uidragdetector
					DragStyle={Enum.UIDragDetectorDragStyle.TranslatePlane}
					ResponseStyle={Enum.UIDragDetectorResponseStyle.Offset}
					Enabled={true}
				/>
			)}

			{/* Title Bar — fixed height, accent bar positioned absolutely */}
			<frame
				LayoutOrder={0}
				Size={new UDim2(1, 0, 0, TITLE_BAR_HEIGHT)}
				BackgroundColor3={BG.deep}
				BorderSizePixel={0}
				ClipsDescendants={true}
			>
				<uicorner CornerRadius={new UDim(0, RADII.xl)} />

				{/* Accent Bar — absolute left edge */}
				<frame
					Position={UDim2.fromOffset(0, 0)}
					Size={new UDim2(0, 3, 1, 0)}
					BackgroundColor3={accentColor}
					BorderSizePixel={0}
					ZIndex={2}
				/>

				{/* Title text */}
				<textlabel
					Position={UDim2.fromOffset(SPACING[4], 0)}
					Size={new UDim2(1, -(SPACING[4] + (onClose !== undefined ? 40 : SPACING[3])), 1, 0)}
					BackgroundTransparency={1}
					Text={string.upper(title)}
					TextColor3={TEXT.primary}
					FontFace={FONTS.display}
					TextSize={FONT_SIZE.md}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Center}
				/>

				{/* Close Button */}
				{onClose !== undefined && (
					<textbutton
						AnchorPoint={new Vector2(1, 0)}
						Position={new UDim2(1, 0, 0, 0)}
						Size={UDim2.fromOffset(TITLE_BAR_HEIGHT, TITLE_BAR_HEIGHT)}
						BackgroundTransparency={1}
						Text={"X"}
						TextColor3={TEXT.tertiary}
						FontFace={FONTS.mono}
						TextSize={FONT_SIZE.md}
						BorderSizePixel={0}
						ZIndex={2}
						Event={{
							Activated: () => {
								if (onClose) onClose();
							},
							MouseEnter: (rbx) => {
								rbx.TextColor3 = SIGNAL.c400;
							},
							MouseLeave: (rbx) => {
								rbx.TextColor3 = TEXT.tertiary;
							},
						}}
					/>
				)}
			</frame>

			{/* Content */}
			<frame
				LayoutOrder={1}
				AutomaticSize={Enum.AutomaticSize.Y}
				Size={new UDim2(1, 0, 0, 0)}
				BackgroundTransparency={1}
			>
				<uipadding
					PaddingLeft={new UDim(0, SPACING[4])}
					PaddingRight={new UDim(0, SPACING[4])}
					PaddingTop={new UDim(0, SPACING[3])}
					PaddingBottom={new UDim(0, SPACING[3])}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					SortOrder={Enum.SortOrder.LayoutOrder}
					Padding={new UDim(0, SPACING[2])}
				/>
				{children}
			</frame>

			{/* Footer */}
			{footer !== undefined && (
				<frame
					LayoutOrder={2}
					AutomaticSize={Enum.AutomaticSize.Y}
					Size={new UDim2(1, 0, 0, 0)}
					BackgroundColor3={BG.deep}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, RADII.xl)} />
					<uipadding
						PaddingLeft={new UDim(0, SPACING[4])}
						PaddingRight={new UDim(0, SPACING[4])}
						PaddingTop={new UDim(0, SPACING[2])}
						PaddingBottom={new UDim(0, SPACING[2])}
					/>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						HorizontalAlignment={Enum.HorizontalAlignment.Right}
						VerticalAlignment={Enum.VerticalAlignment.Center}
						Padding={new UDim(0, SPACING[2])}
					/>
					{footer}
				</frame>
			)}
		</frame>
	);
}

export default WindowPanel;
