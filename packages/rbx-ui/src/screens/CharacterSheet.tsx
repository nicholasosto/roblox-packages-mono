/**
 * CharacterSheet — Stat allocation modal
 *
 * Screen-level component. Centered panel with character info,
 * stat allocation with +/- buttons, and derived stats.
 */
import React, { useState } from "@rbxts/react";
import { AMBER, BG, BORDER, FONTS, FONT_SIZE, INTEL, PURPLE, RADII, SIGNAL, SPACING, STAT, TEXT, withAlpha } from "../design-system/Tokens";
import type { CharacterData, CharacterStat } from "../types";

export interface CharacterSheetProps {
	character: CharacterData;
	onApply?: (allocations: Map<string, number>) => void;
	onReset?: () => void;
}

interface StatRowProps {
	stat: CharacterStat;
	allocated: number;
	canAllocate: boolean;
	onAdd: () => void;
	onSub: () => void;
}

function StatRow(props: StatRowProps) {
	const total = props.stat.base + props.allocated;
	const hasAllocation = props.allocated > 0;

	return (
		<frame Size={new UDim2(1, 0, 0, 32)} BackgroundTransparency={1}>
			<textlabel
				Text={props.stat.label}
				FontFace={FONTS.mono}
				TextSize={FONT_SIZE.md}
				TextColor3={TEXT.secondary}
				TextXAlignment={Enum.TextXAlignment.Left}
				Size={new UDim2(0, 50, 1, 0)}
				BackgroundTransparency={1}
			/>
			<textlabel
				Text={`${props.stat.base}`}
				FontFace={FONTS.mono}
				TextSize={FONT_SIZE.md}
				TextColor3={TEXT.primary}
				Size={new UDim2(0, 30, 1, 0)}
				Position={new UDim2(0, 55, 0, 0)}
				BackgroundTransparency={1}
			/>
			{hasAllocation && (
				<textlabel
					Text={`+${props.allocated}`}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.sm}
					TextColor3={STAT.positive}
					Size={new UDim2(0, 30, 1, 0)}
					Position={new UDim2(0, 88, 0, 0)}
					BackgroundTransparency={1}
				/>
			)}
			<textlabel
				Text={`= ${total}`}
				FontFace={FONTS.mono}
				TextSize={FONT_SIZE.md}
				TextColor3={hasAllocation ? AMBER.c400 : TEXT.primary}
				Size={new UDim2(0, 40, 1, 0)}
				Position={new UDim2(0, 120, 0, 0)}
				BackgroundTransparency={1}
			/>
			<textbutton
				Text="-"
				FontFace={FONTS.mono}
				TextSize={FONT_SIZE.lg}
				TextColor3={hasAllocation ? SIGNAL.c400 : TEXT.tertiary}
				Size={new UDim2(0, 28, 0, 28)}
				Position={new UDim2(0, 170, 0, 2)}
				BackgroundColor3={BG.elevated}
				BorderSizePixel={0}
				AutoButtonColor={false}
				Event={{ Activated: props.onSub }}
			>
				<uicorner CornerRadius={new UDim(0, RADII.md)} />
			</textbutton>
			<textbutton
				Text="+"
				FontFace={FONTS.mono}
				TextSize={FONT_SIZE.lg}
				TextColor3={props.canAllocate ? STAT.positive : TEXT.tertiary}
				Size={new UDim2(0, 28, 0, 28)}
				Position={new UDim2(0, 204, 0, 2)}
				BackgroundColor3={BG.elevated}
				BorderSizePixel={0}
				AutoButtonColor={false}
				Event={{ Activated: props.onAdd }}
			>
				<uicorner CornerRadius={new UDim(0, RADII.md)} />
			</textbutton>
		</frame>
	);
}

export default function CharacterSheet(props: CharacterSheetProps) {
	const [allocations, setAllocations] = useState<Map<string, number>>(new Map());

	const totalAllocated = (() => {
		let sum = 0;
		allocations.forEach((v) => { sum += v; });
		return sum;
	})();
	const remaining = props.character.availablePoints - totalAllocated;

	function addPoint(statId: string) {
		if (remaining <= 0) return;
		setAllocations((prev) => {
			const updated = new Map<string, number>();
			prev.forEach((v, k) => updated.set(k, v));
			updated.set(statId, (prev.get(statId) ?? 0) + 1);
			return updated;
		});
	}

	function subPoint(statId: string) {
		const current = allocations.get(statId) ?? 0;
		if (current <= 0) return;
		setAllocations((prev) => {
			const updated = new Map<string, number>();
			prev.forEach((v, k) => updated.set(k, v));
			updated.set(statId, (prev.get(statId) ?? 0) - 1);
			return updated;
		});
	}

	function handleReset() {
		setAllocations(new Map());
		if (props.onReset) props.onReset();
	}

	function handleApply() {
		if (props.onApply) props.onApply(allocations);
	}

	const char = props.character;

	return (
		<frame
			Size={new UDim2(0, 520, 0, 460)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			BackgroundColor3={BG.surface}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, RADII.xl)} />
			<uistroke Color={BORDER.accent} Thickness={1} />
			<uipadding
				PaddingLeft={new UDim(0, SPACING[5])}
				PaddingRight={new UDim(0, SPACING[5])}
				PaddingTop={new UDim(0, SPACING[4])}
				PaddingBottom={new UDim(0, SPACING[4])}
			/>

			{/* Header */}
			<frame Size={new UDim2(1, 0, 0, 60)} BackgroundTransparency={1}>
				<frame Size={new UDim2(0, 3, 0, 44)} BackgroundColor3={AMBER.c500} BorderSizePixel={0} />
				<frame Size={new UDim2(1, -16, 1, 0)} Position={new UDim2(0, 16, 0, 0)} BackgroundTransparency={1}>
					<textlabel
						Text={char.name} FontFace={FONTS.display} TextSize={FONT_SIZE.xl}
						TextColor3={TEXT.primary} TextXAlignment={Enum.TextXAlignment.Left}
						Size={new UDim2(1, 0, 0, 24)} BackgroundTransparency={1}
					/>
					<textlabel
						Text={`${char.className} | ${char.domain} | Lv. ${char.level}`}
						FontFace={FONTS.body} TextSize={FONT_SIZE.sm} TextColor3={TEXT.secondary}
						TextXAlignment={Enum.TextXAlignment.Left}
						Size={new UDim2(1, 0, 0, 16)} Position={new UDim2(0, 0, 0, 26)} BackgroundTransparency={1}
					/>
					<frame Size={new UDim2(1, 0, 0, 6)} Position={new UDim2(0, 0, 0, 48)} BackgroundColor3={BG.elevated} BorderSizePixel={0}>
						<uicorner CornerRadius={new UDim(0, 3)} />
						<frame Size={new UDim2(char.xp / char.xpToNext, 0, 1, 0)} BackgroundColor3={PURPLE.c400} BorderSizePixel={0}>
							<uicorner CornerRadius={new UDim(0, 3)} />
						</frame>
					</frame>
				</frame>
			</frame>

			{/* Available points badge */}
			<frame
				Size={new UDim2(1, 0, 0, 28)} Position={new UDim2(0, 0, 0, 70)}
				BackgroundColor3={remaining > 0 ? withAlpha(AMBER.c500, 0.15).color : BG.elevated}
				BackgroundTransparency={remaining > 0 ? withAlpha(AMBER.c500, 0.15).transparency : 0}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, RADII.md)} />
				<textlabel
					Text={remaining > 0 ? `${remaining} points available` : "No points available"}
					FontFace={FONTS.mono} TextSize={FONT_SIZE.sm}
					TextColor3={remaining > 0 ? AMBER.c400 : TEXT.tertiary}
					Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}
				/>
			</frame>

			{/* Stat Rows */}
			<frame Size={new UDim2(1, 0, 0, 180)} Position={new UDim2(0, 0, 0, 108)} BackgroundTransparency={1}>
				<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, SPACING[1])} SortOrder={Enum.SortOrder.LayoutOrder} />
				{char.stats.map((stat) => (
					<StatRow
						key={stat.id}
						stat={stat}
						allocated={allocations.get(stat.id) ?? 0}
						canAllocate={remaining > 0}
						onAdd={() => addPoint(stat.id)}
						onSub={() => subPoint(stat.id)}
					/>
				))}
			</frame>

			{/* Derived Stats */}
			<frame
				Size={new UDim2(1, 0, 0, 80)} Position={new UDim2(0, 0, 0, 300)}
				BackgroundColor3={BG.elevated} BackgroundTransparency={0.5} BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, RADII.md)} />
				<uipadding
					PaddingLeft={new UDim(0, SPACING[3])} PaddingRight={new UDim(0, SPACING[3])}
					PaddingTop={new UDim(0, SPACING[2])} PaddingBottom={new UDim(0, SPACING[2])}
				/>
				<textlabel
					Text="DERIVED STATS" FontFace={FONTS.display} TextSize={FONT_SIZE.xs}
					TextColor3={TEXT.tertiary} TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(1, 0, 0, 14)} BackgroundTransparency={1}
				/>
				<frame Size={new UDim2(1, 0, 0, 50)} Position={new UDim2(0, 0, 0, 18)} BackgroundTransparency={1}>
					<uigridlayout CellSize={new UDim2(0.5, -4, 0, 22)} CellPadding={new UDim2(0, 8, 0, 4)} SortOrder={Enum.SortOrder.LayoutOrder} />
					{char.derived.map((d) => (
						<frame key={d.id} BackgroundTransparency={1}>
							<textlabel Text={d.label} FontFace={FONTS.body} TextSize={FONT_SIZE.sm} TextColor3={TEXT.secondary} TextXAlignment={Enum.TextXAlignment.Left} Size={new UDim2(0.6, 0, 1, 0)} BackgroundTransparency={1} />
							<textlabel Text={d.value} FontFace={FONTS.mono} TextSize={FONT_SIZE.sm} TextColor3={INTEL.c400} TextXAlignment={Enum.TextXAlignment.Right} Size={new UDim2(0.4, 0, 1, 0)} Position={new UDim2(0.6, 0, 0, 0)} BackgroundTransparency={1} />
						</frame>
					))}
				</frame>
			</frame>

			{/* Footer Buttons */}
			<frame Size={new UDim2(1, 0, 0, 36)} Position={new UDim2(0, 0, 1, -36)} BackgroundTransparency={1}>
				<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, SPACING[2])} HorizontalAlignment={Enum.HorizontalAlignment.Right} SortOrder={Enum.SortOrder.LayoutOrder} />
				<textbutton
					Text="Reset" FontFace={FONTS.body} TextSize={FONT_SIZE.md} TextColor3={TEXT.secondary}
					Size={new UDim2(0, 80, 0, 32)} BackgroundColor3={BG.elevated} BorderSizePixel={0} AutoButtonColor={false}
					Event={{ Activated: handleReset }}
				>
					<uicorner CornerRadius={new UDim(0, RADII.md)} />
				</textbutton>
				<textbutton
					Text="Apply" FontFace={FONTS.body} TextSize={FONT_SIZE.md} TextColor3={BG.deep}
					Size={new UDim2(0, 80, 0, 32)} BackgroundColor3={AMBER.c500} BorderSizePixel={0} AutoButtonColor={false}
					Event={{ Activated: handleApply }}
				>
					<uicorner CornerRadius={new UDim(0, RADII.md)} />
				</textbutton>
			</frame>
		</frame>
	);
}
