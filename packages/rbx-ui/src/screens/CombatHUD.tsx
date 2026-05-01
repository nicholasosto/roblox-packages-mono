/**
 * CombatHUD — Full-screen combat overlay
 *
 * Screen-level component. Renders player frame (top-left), target frame (top-right),
 * resource bars (bottom-center), ability bar (bottom-center), and damage popups (center).
 */
import React from "@rbxts/react";
import { FONTS, FONT_SIZE, SIGNAL, SPACING, STAT, TEXT } from "../design-system/Tokens";
import type { AbilityData, CombatEntityData, DamagePopup, ResourceData } from "../types";
import PlayerFrame from "../components/PlayerFrame";
import TargetFrame from "../components/TargetFrame";
import ResourceBar from "../components/ResourceBar";
import AbilitySlot from "../components/AbilitySlot";

export interface CombatHUDProps {
	player: { name: string; level: number; resources: ResourceData[] };
	target?: CombatEntityData;
	abilities: AbilityData[];
	damagePopups?: DamagePopup[];
}

export default function CombatHUD(props: CombatHUDProps) {
	return (
		<frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
			{/* ── Top-left: Player Frame ─────────────────── */}
			<PlayerFrame name={props.player.name} level={props.player.level} />

			{/* ── Top-right: Target Frame ────────────────── */}
			{props.target !== undefined && (
				<frame
					Size={new UDim2(0, 240, 0, 60)}
					AnchorPoint={new Vector2(1, 0)}
					Position={new UDim2(1, 0, 0, 0)}
					BackgroundTransparency={1}
				>
					<TargetFrame target={props.target} />
				</frame>
			)}

			{/* ── Center: Damage Popups ──────────────────── */}
			{props.damagePopups !== undefined && props.damagePopups.size() > 0 && (
				<frame
					Size={new UDim2(0, 200, 0, 120)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					Position={new UDim2(0.5, 0, 0.4, 0)}
					BackgroundTransparency={1}
				>
					{props.damagePopups.map((popup, i) => (
						<textlabel
							key={popup.id}
							Text={popup.type === "damage" ? `${popup.value}` : `+${popup.value}`}
							FontFace={FONTS.display}
							TextSize={popup.type === "damage" ? 36 : 28}
							TextColor3={popup.type === "damage" ? SIGNAL.c400 : STAT.positive}
							Size={new UDim2(1, 0, 0, 40)}
							Position={new UDim2(popup.type === "damage" ? 0 : 0.3, 0, 0, i * 50)}
							BackgroundTransparency={1}
							TextStrokeTransparency={0.5}
							TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
						/>
					))}
				</frame>
			)}

			{/* ── Bottom-center: Resource Bars ───────────── */}
			<frame
				Size={new UDim2(0, 300, 0, 110)}
				AnchorPoint={new Vector2(0.5, 1)}
				Position={new UDim2(0.5, 0, 1, -80)}
				BackgroundTransparency={1}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, SPACING[1])}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				{props.player.resources.map((res) => (
					<ResourceBar
						key={res.id}
						label={res.label}
						current={res.current}
						max={res.max}
						color={res.color}
						height={16}
					/>
				))}
			</frame>

			{/* ── Bottom-center: Ability Bar ─────────────── */}
			<frame
				Size={new UDim2(0, 260, 0, 56)}
				AnchorPoint={new Vector2(0.5, 1)}
				Position={new UDim2(0.5, 0, 1, -12)}
				BackgroundTransparency={1}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, SPACING[2])}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				{props.abilities.map((ability) => (
					<AbilitySlot
						key={ability.id}
						icon={ability.icon}
						keybind={ability.keybind}
						cooldown={ability.cooldown}
						maxCooldown={ability.maxCooldown}
						name={ability.name}
					/>
				))}
			</frame>
		</frame>
	);
}
