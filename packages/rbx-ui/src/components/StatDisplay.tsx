/**
 * StatDisplay — Cross-platform component (Roblox implementation)
 *
 * A generic stat display panel with optional modifier mode (+/- buttons
 * for point allocation). Supports any array of named stats.
 *
 * Web equivalent: packages/ui-library/src/components/StatDisplay.tsx
 */

import React from "@rbxts/react";
import {
	BG, BORDER, TEXT, FONTS, FONT_SIZE, SPACING, RADII, AMBER, STAT,
	withAlpha,
} from "../design-system/Tokens";

// ── Types ──────────────────────────────────────────────────

export interface StatItem {
	id: string;
	label: string;
	value: number;
	icon?: string;
	color?: Color3;
	max?: number;
}

export interface StatDisplayProps {
	stats: StatItem[];
	title?: string;
	modifiable?: boolean;
	availablePoints?: number;
	onStatChange?: (id: string, delta: number) => void;
	accentColor?: Color3;
	size?: "sm" | "md";
	columns?: 1 | 2;
}

// ── Constants ──────────────────────────────────────────────

const ROW_HEIGHT_SM = 24;
const ROW_HEIGHT_MD = 32;
const BAR_HEIGHT_SM = 3;
const BAR_HEIGHT_MD = 5;
const BTN_SIZE_SM = 20;
const BTN_SIZE_MD = 24;
const HEADER_HEIGHT = 32;

// ── Sub-Components ─────────────────────────────────────────

interface ModButtonProps {
	label: string;
	disabled: boolean;
	hoverColor: Color3;
	size: number;
	onClick: () => void;
}

function ModButton({ label, disabled, hoverColor, size, onClick }: ModButtonProps) {
	return (
		<textbutton
			Text={label}
			Size={new UDim2(0, size, 0, size)}
			BackgroundColor3={BG.hover}
			TextColor3={disabled ? TEXT.tertiary : TEXT.secondary}
			FontFace={FONTS.mono}
			TextSize={size === BTN_SIZE_SM ? FONT_SIZE.xs : FONT_SIZE.sm}
			AutoButtonColor={false}
			Active={!disabled}
			Event={{
				Activated: () => {
					if (!disabled) onClick();
				},
				MouseEnter: (rbx) => {
					if (disabled) return;
					rbx.BackgroundColor3 = withAlpha(hoverColor, 0.2).color;
					rbx.BackgroundTransparency = withAlpha(hoverColor, 0.2).transparency;
					rbx.TextColor3 = hoverColor;
				},
				MouseLeave: (rbx) => {
					rbx.BackgroundColor3 = BG.hover;
					rbx.BackgroundTransparency = 0;
					rbx.TextColor3 = disabled ? TEXT.tertiary : TEXT.secondary;
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, RADII.sm)} />
			<uistroke Color={BORDER.subtle} Thickness={1} />
		</textbutton>
	);
}

interface StatRowProps {
	stat: StatItem;
	modifiable?: boolean;
	availablePoints: number;
	onStatChange?: (id: string, delta: number) => void;
	size: "sm" | "md";
	layoutOrder: number;
}

function StatRow({ stat, modifiable, availablePoints, onStatChange, size, layoutOrder }: StatRowProps) {
	const rowH = size === "sm" ? ROW_HEIGHT_SM : ROW_HEIGHT_MD;
	const fontSize = size === "sm" ? FONT_SIZE.sm : FONT_SIZE.md;
	const valueFontSize = size === "sm" ? FONT_SIZE.sm : FONT_SIZE.lg;
	const barH = size === "sm" ? BAR_HEIGHT_SM : BAR_HEIGHT_MD;
	const btnSize = size === "sm" ? BTN_SIZE_SM : BTN_SIZE_MD;
	const hasBar = stat.max !== undefined && stat.max > 0;
	const totalH = hasBar ? rowH + barH + 4 : rowH;

	return (
		<frame
			Size={new UDim2(1, 0, 0, totalH)}
			BackgroundTransparency={1}
			LayoutOrder={layoutOrder}
		>
			{/* Main row */}
			<frame
				Size={new UDim2(1, 0, 0, rowH)}
				BackgroundTransparency={1}
			>
				{/* Icon — supports rbxasset:// image paths or text labels */}
				{stat.icon !== undefined && (
					stat.icon.sub(1, 11) === "rbxasset://" ? (
						<imagelabel
							Image={stat.icon}
							Size={new UDim2(0, 24, 0, 24)}
							Position={new UDim2(0, 0, 0.5, -12)}
							BackgroundTransparency={1}
							ScaleType={Enum.ScaleType.Fit}
							ImageColor3={stat.color ?? TEXT.secondary}
						/>
					) : (
						<textlabel
							Text={stat.icon}
							Size={new UDim2(0, 24, 1, 0)}
							Position={new UDim2(0, 0, 0, 0)}
							BackgroundTransparency={1}
							TextColor3={stat.color ?? TEXT.secondary}
							FontFace={FONTS.mono}
							TextSize={FONT_SIZE.xs}
							TextXAlignment={Enum.TextXAlignment.Center}
							TextYAlignment={Enum.TextYAlignment.Center}
						/>
					)
				)}

				{/* Label */}
				<textlabel
					Text={stat.label}
					Size={new UDim2(1, -(24 + 48 + (modifiable ? (btnSize * 2 + 8) : 0)), 1, 0)}
					Position={new UDim2(0, stat.icon !== undefined ? 28 : 0, 0, 0)}
					BackgroundTransparency={1}
					TextColor3={TEXT.secondary}
					FontFace={FONTS.body}
					TextSize={fontSize}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Center}
				/>

				{/* Value */}
				<textlabel
					Text={stat.max !== undefined ? `${stat.value} / ${stat.max}` : tostring(stat.value)}
					Size={new UDim2(0, 48, 1, 0)}
					Position={new UDim2(1, -(48 + (modifiable ? (btnSize * 2 + 8) : 0)), 0, 0)}
					BackgroundTransparency={1}
					TextColor3={stat.color ?? TEXT.primary}
					FontFace={FONTS.mono}
					TextSize={valueFontSize}
					TextXAlignment={Enum.TextXAlignment.Right}
					TextYAlignment={Enum.TextYAlignment.Center}
				/>

				{/* Modifier buttons (positioned absolutely) */}
				{modifiable && (
					<frame
						Size={new UDim2(0, btnSize * 2 + 4, 1, 0)}
						Position={new UDim2(1, -(btnSize * 2 + 4), 0, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Horizontal}
							SortOrder={Enum.SortOrder.LayoutOrder}
							Padding={new UDim(0, 2)}
							VerticalAlignment={Enum.VerticalAlignment.Center}
						/>
						<ModButton
							label="−"
							disabled={stat.value <= 0}
							hoverColor={STAT.negative}
							size={btnSize}
							onClick={() => onStatChange?.(stat.id, -1)}
						/>
						<ModButton
							label="+"
							disabled={availablePoints <= 0}
							hoverColor={STAT.positive}
							size={btnSize}
							onClick={() => onStatChange?.(stat.id, 1)}
						/>
					</frame>
				)}
			</frame>

			{/* Progress bar */}
			{hasBar && (
				<frame
					Size={new UDim2(1, stat.icon !== undefined ? -28 : 0, 0, barH)}
					Position={new UDim2(0, stat.icon !== undefined ? 28 : 0, 0, rowH + 2)}
					BackgroundColor3={BG.hover}
				>
					<uicorner CornerRadius={new UDim(0, RADII.full)} />
					{/* Fill */}
					<frame
						Size={new UDim2(math.clamp(stat.value / stat.max!, 0, 1), 0, 1, 0)}
						BackgroundColor3={stat.color ?? AMBER.c400}
					>
						<uicorner CornerRadius={new UDim(0, RADII.full)} />
					</frame>
				</frame>
			)}
		</frame>
	);
}

// ── Main Component ─────────────────────────────────────────

function StatDisplay({
	stats,
	title,
	modifiable = false,
	availablePoints = 0,
	onStatChange,
	accentColor = AMBER.c400,
	size = "md",
	columns = 1,
}: StatDisplayProps) {
	const pad = size === "sm" ? SPACING[2] : SPACING[3];
	const gap = size === "sm" ? SPACING[1] : SPACING[2];
	const hasHeader = title !== undefined || (modifiable && availablePoints !== undefined);

	return (
		<frame
			AutomaticSize={Enum.AutomaticSize.Y}
			Size={new UDim2(1, 0, 0, 0)}
			BackgroundColor3={BG.elevated}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.lg)} />
			<uistroke Color={BORDER.subtle} Thickness={1} />

			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			{/* Header */}
			{hasHeader && (
				<frame
					Size={new UDim2(1, 0, 0, HEADER_HEIGHT)}
					BackgroundColor3={BG.deep}
					BorderSizePixel={0}
					LayoutOrder={0}
				>
					{/* Accent bar */}
					<frame
						Size={new UDim2(0, 3, 1, 0)}
						Position={new UDim2(0, 0, 0, 0)}
						BackgroundColor3={accentColor}
						BorderSizePixel={0}
					/>

					{/* Title */}
					{title !== undefined && (
						<textlabel
							Text={string.upper(title)}
							Size={new UDim2(0.6, 0, 1, 0)}
							Position={new UDim2(0, SPACING[3], 0, 0)}
							BackgroundTransparency={1}
							TextColor3={TEXT.primary}
							FontFace={FONTS.display}
							TextSize={FONT_SIZE.xs}
							TextXAlignment={Enum.TextXAlignment.Left}
							TextYAlignment={Enum.TextYAlignment.Center}
						/>
					)}

					{/* Point pool badge */}
					{modifiable && availablePoints !== undefined && (
						<textlabel
							Text={`${availablePoints} pts`}
							Size={new UDim2(0.3, 0, 1, 0)}
							Position={new UDim2(0.7, -SPACING[3], 0, 0)}
							BackgroundTransparency={1}
							TextColor3={AMBER.c400}
							FontFace={FONTS.mono}
							TextSize={FONT_SIZE.xs}
							TextXAlignment={Enum.TextXAlignment.Right}
							TextYAlignment={Enum.TextYAlignment.Center}
						/>
					)}

					{/* Bottom border */}
					<frame
						Size={new UDim2(1, 0, 0, 1)}
						Position={new UDim2(0, 0, 1, -1)}
						BackgroundColor3={BORDER.subtle}
						BorderSizePixel={0}
					/>
				</frame>
			)}

			{/* Stats body */}
			<frame
				AutomaticSize={Enum.AutomaticSize.Y}
				Size={new UDim2(1, 0, 0, 0)}
				BackgroundTransparency={1}
				LayoutOrder={1}
			>
				<uipadding
					PaddingLeft={new UDim(0, pad)}
					PaddingRight={new UDim(0, pad)}
					PaddingTop={new UDim(0, pad)}
					PaddingBottom={new UDim(0, pad)}
				/>

				{columns === 2 ? (
					<uigridlayout
						CellSize={new UDim2(0.5, -gap / 2, 0, size === "sm" ? ROW_HEIGHT_SM + 8 : ROW_HEIGHT_MD + 8)}
						CellPadding={new UDim2(0, gap, 0, gap)}
						SortOrder={Enum.SortOrder.LayoutOrder}
						FillDirection={Enum.FillDirection.Horizontal}
					/>
				) : (
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						SortOrder={Enum.SortOrder.LayoutOrder}
						Padding={new UDim(0, gap)}
					/>
				)}

				{stats.map((stat, i) => (
					<StatRow
						key={stat.id}
						stat={stat}
						modifiable={modifiable}
						availablePoints={availablePoints}
						onStatChange={onStatChange}
						size={size}
						layoutOrder={i}
					/>
				))}
			</frame>
		</frame>
	);
}

export default StatDisplay;
