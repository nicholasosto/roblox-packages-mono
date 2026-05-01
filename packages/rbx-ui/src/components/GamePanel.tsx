/**
 * GamePanel — Cross-platform component (Roblox implementation)
 *
 * An immersive game-style panel with multi-layer background, decorative
 * header with separator, overlaid close button, and optional footer.
 * Inspired by EpicUI BaseFrame panel structure, using Trembus design tokens.
 *
 * Web equivalent: packages/ui-library/src/components/GamePanel.tsx
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
	TACTICAL,
	INTEL,
	SIGNAL,
	PURPLE,
} from "../design-system/Tokens";

// ── Types ───────────────────────────────────────────────────

type AccentColor = "amber" | "green" | "blue" | "red" | "purple";

interface GamePanelProps {
	/** Panel title (rendered uppercase in display font) */
	title: string;
	/** Optional subtitle below the title */
	subtitle?: string;
	/** Accent color theme for the background fill */
	accentColor?: AccentColor;
	/** Panel width/height in pixels */
	size?: "sm" | "md" | "lg";
	/** Close button handler (button hidden if omitted) */
	onClose?: () => void;
	/** Optional footer content */
	footer?: React.ReactNode;
	/** Main content area */
	children?: React.ReactNode;
}

// ── Accent color mapping ───────────────────────────────────

interface AccentConfig {
	bg: Color3;
	bgLight: { color: Color3; transparency: number };
	border: Color3;
	text: Color3;
	separator: { color: Color3; transparency: number };
}

const ACCENT_MAP: Record<AccentColor, AccentConfig> = {
	amber: {
		bg: AMBER.c600,
		bgLight: { color: AMBER.c500, transparency: 0.8 },
		border: AMBER.c500,
		text: AMBER.c300,
		separator: { color: AMBER.c400, transparency: 0.7 },
	},
	green: {
		bg: TACTICAL.c500,
		bgLight: { color: TACTICAL.c500, transparency: 0.8 },
		border: TACTICAL.c500,
		text: TACTICAL.c400,
		separator: { color: TACTICAL.c400, transparency: 0.7 },
	},
	blue: {
		bg: INTEL.c500,
		bgLight: { color: INTEL.c500, transparency: 0.8 },
		border: INTEL.c500,
		text: INTEL.c400,
		separator: { color: INTEL.c400, transparency: 0.7 },
	},
	red: {
		bg: SIGNAL.c500,
		bgLight: { color: SIGNAL.c500, transparency: 0.8 },
		border: SIGNAL.c500,
		text: SIGNAL.c400,
		separator: { color: SIGNAL.c400, transparency: 0.7 },
	},
	purple: {
		bg: PURPLE.c500,
		bgLight: { color: PURPLE.c500, transparency: 0.8 },
		border: PURPLE.c500,
		text: PURPLE.c400,
		separator: { color: PURPLE.c400, transparency: 0.7 },
	},
};

// ── Size presets (from EpicUI: BaseFrame=600x300, StoreWindow=800x600) ──

const SIZE_PX: Record<string, { width: number; height: number }> = {
	sm: { width: 400, height: 250 },
	md: { width: 600, height: 300 },
	lg: { width: 800, height: 450 },
};

const CORNER_RADIUS = RADII.lg; // 8px — close to EpicUI's 6px but matches token grid
const HEADER_FRACTION = 0.2;

// ── Main Component ──────────────────────────────────────────

function GamePanel({
	title,
	subtitle,
	accentColor = "amber",
	size = "md",
	onClose,
	footer,
	children,
}: GamePanelProps) {
	const config = ACCENT_MAP[accentColor] ?? ACCENT_MAP.amber;
	const dims = SIZE_PX[size] ?? SIZE_PX.md;

	return (
		<frame
			Size={UDim2.fromOffset(dims.width, dims.height)}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, CORNER_RADIUS)} />
			<uistroke Color={config.border} Thickness={1} Transparency={0.7} />

			{/* ── Background layers (EpicUI: Shadow → Color → Highlight) ── */}
			<frame
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				ZIndex={1}
			>
				{/* Shadow — offset bottom, matches EpicUI Shadow frame */}
				<frame
					Size={new UDim2(1, 0, 1, 5)}
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.2}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, CORNER_RADIUS)} />
				</frame>

				{/* Color fill — accent tint, offset top by 4px like EpicUI */}
				<frame
					Size={new UDim2(1, 0, 1, -4)}
					Position={new UDim2(0, 0, 0, 4)}
					BackgroundColor3={config.bg}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, CORNER_RADIUS)} />
				</frame>

				{/* Highlight — lighter overlay for depth */}
				<frame
					Size={new UDim2(1, 0, 1, 0)}
					BackgroundColor3={config.bgLight.color}
					BackgroundTransparency={config.bgLight.transparency}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, CORNER_RADIUS)} />
				</frame>
			</frame>

			{/* ── Close button (EpicUI: 11% width, aspect 1:1, top-right) ── */}
			{onClose !== undefined && (
				<textbutton
					AnchorPoint={new Vector2(1, 0)}
					Position={new UDim2(1, 0, 0, 0)}
					Size={UDim2.fromOffset(32, 32)}
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.6}
					Text={"X"}
					TextColor3={TEXT.tertiary}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.md}
					BorderSizePixel={0}
					ZIndex={10}
					Event={{
						Activated: () => {
							if (onClose) onClose();
						},
						MouseEnter: (rbx) => {
							rbx.TextColor3 = SIGNAL.c400;
							rbx.BackgroundTransparency = 0.4;
						},
						MouseLeave: (rbx) => {
							rbx.TextColor3 = TEXT.tertiary;
							rbx.BackgroundTransparency = 0.6;
						},
					}}
				>
					<uicorner CornerRadius={new UDim(0, RADII.md)} />
				</textbutton>
			)}

			{/* ── Content layer ── */}
			<frame
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				ZIndex={5}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				{/* Header — dark overlay, matches EpicUI Header (20% height, BgTransp=0.85) */}
				<frame
					LayoutOrder={0}
					Size={new UDim2(1, 0, HEADER_FRACTION, 0)}
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.15}
					BorderSizePixel={0}
					ClipsDescendants={true}
				>
					<uipadding
						PaddingLeft={new UDim(0, SPACING[4])}
						PaddingRight={new UDim(0, SPACING[4])}
						PaddingTop={new UDim(0, SPACING[2])}
						PaddingBottom={new UDim(0, SPACING[1])}
					/>

					{/* Title */}
					<textlabel
						Size={new UDim2(1, 0, 0, FONT_SIZE["2xl"])}
						BackgroundTransparency={1}
						Text={string.upper(title)}
						TextColor3={TEXT.primary}
						FontFace={FONTS.display}
						TextSize={FONT_SIZE["2xl"]}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Top}
					/>

					{/* Subtitle */}
					{subtitle !== undefined && (
						<textlabel
							Position={new UDim2(0, 0, 0, FONT_SIZE["2xl"] + 2)}
							Size={new UDim2(1, 0, 0, FONT_SIZE.sm)}
							BackgroundTransparency={1}
							Text={subtitle}
							TextColor3={config.text}
							FontFace={FONTS.body}
							TextSize={FONT_SIZE.sm}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
					)}

					{/* Separator line — matches EpicUI Line frame */}
					<frame
						AnchorPoint={new Vector2(0, 1)}
						Position={new UDim2(0, 0, 1, 0)}
						Size={new UDim2(1, 0, 0, 1)}
						BackgroundColor3={config.separator.color}
						BackgroundTransparency={config.separator.transparency}
						BorderSizePixel={0}
					/>
				</frame>

				{/* Body */}
				<frame
					LayoutOrder={1}
					Size={new UDim2(1, 0, 1 - HEADER_FRACTION - (footer !== undefined ? 0.15 : 0), 0)}
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
						Size={new UDim2(1, 0, 0.15, 0)}
						BackgroundColor3={Color3.fromRGB(0, 0, 0)}
						BackgroundTransparency={0.4}
						BorderSizePixel={0}
					>
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
		</frame>
	);
}

export default GamePanel;
