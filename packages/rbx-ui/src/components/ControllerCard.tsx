/**
 * ControllerCard — Cross-platform component (Roblox implementation)
 *
 * Displays a single Flamework controller with its network connections,
 * associated components, and dependencies.
 *
 * Web equivalent: packages/ui-library/src/components/ControllerCard.tsx
 */
import React, { useState } from "@rbxts/react";
import {
	BG,
	BORDER,
	TEXT,
	FONTS,
	FONT_SIZE,
	SPACING,
	RADII,
	AMBER,
	INTEL,
	SIGNAL,
	PURPLE,
	TACTICAL,
	INTENT_COLORS,
} from "../design-system/Tokens";
import { getIntent } from "../design-system/StatusIntentMap";
import StatusBadge from "./StatusBadge";

// ── Types ───────────────────────────────────────────────────

interface ControllerEndpoint {
	id: string;
	type: "event" | "function";
	direction: "consumed" | "fired";
	serviceName: string;
}

interface ControllerComponent {
	name: string;
	status: string;
}

interface ControllerCardProps {
	name: string;
	description: string;
	domain: { name: string; color: Color3 };
	status: string;
	endpoints?: ControllerEndpoint[];
	components?: ControllerComponent[];
	dependencies?: string[];
	selected?: boolean;
	onSelect?: () => void;
}

// ── Status dot color lookup ─────────────────────────────────

const STATUS_DOT_COLOR: Record<string, Color3> = {
	implemented: TACTICAL.c400,
	"in-progress": AMBER.c400,
	planned: INTEL.c400,
	deprecated: TEXT.tertiary,
};

// ── Chip sub-component ──────────────────────────────────────

function Chip({ text, dotColor }: { text: string; dotColor?: Color3 }) {
	return (
		<frame
			AutomaticSize={Enum.AutomaticSize.XY}
			BackgroundColor3={BG.elevated}
			BorderSizePixel={0}
			Size={UDim2.fromOffset(0, 0)}
		>
			<uicorner CornerRadius={new UDim(0, RADII.md)} />
			<uistroke Color={BORDER.subtle} Thickness={1} />
			<uipadding
				PaddingLeft={new UDim(0, 6)}
				PaddingRight={new UDim(0, 6)}
				PaddingTop={new UDim(0, 2)}
				PaddingBottom={new UDim(0, 2)}
			/>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				Padding={new UDim(0, 4)}
			/>
			<textlabel
				AutomaticSize={Enum.AutomaticSize.XY}
				BackgroundTransparency={1}
				Text={text}
				TextColor3={TEXT.secondary}
				FontFace={FONTS.mono}
				TextSize={10}
				Size={UDim2.fromOffset(0, 0)}
			/>
			{dotColor !== undefined && (
				<frame
					Size={UDim2.fromOffset(6, 6)}
					BackgroundColor3={dotColor}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</frame>
			)}
		</frame>
	);
}

// ── Endpoint row sub-component ──────────────────────────────

function EndpointRow({ ep }: { ep: ControllerEndpoint }) {
	const typeColor = ep.type === "event" ? AMBER.c400 : INTEL.c400;
	const typeLabel = ep.type === "event" ? "E" : "F";

	if (ep.direction === "consumed") {
		return (
			<frame AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Size={UDim2.fromOffset(0, 0)}>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					Padding={new UDim(0, 4)}
				/>
				<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={ep.serviceName} TextColor3={TEXT.secondary} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
				<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={"→"} TextColor3={TEXT.tertiary} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
				<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={`[${typeLabel}]`} TextColor3={typeColor} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
				<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={ep.id} TextColor3={TEXT.primary} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
			</frame>
		);
	}

	// fired
	return (
		<frame AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Size={UDim2.fromOffset(0, 0)}>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				Padding={new UDim(0, 4)}
			/>
			<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={`[${typeLabel}]`} TextColor3={typeColor} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
			<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={ep.id} TextColor3={TEXT.primary} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
			<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={"→"} TextColor3={TEXT.tertiary} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
			<textlabel AutomaticSize={Enum.AutomaticSize.XY} BackgroundTransparency={1} Text={ep.serviceName} TextColor3={TEXT.secondary} FontFace={FONTS.mono} TextSize={11} Size={UDim2.fromOffset(0, 0)} />
		</frame>
	);
}

// ── Main Component ──────────────────────────────────────────

function ControllerCard({
	name,
	description,
	domain,
	status,
	endpoints = [],
	components = [],
	dependencies = [],
	selected = false,
	onSelect,
}: ControllerCardProps) {
	const consumed = endpoints.filter((e) => e.direction === "consumed");
	const fired = endpoints.filter((e) => e.direction === "fired");
	const borderColor = selected ? INTEL.c400 : BORDER.subtle;
	const hasEndpoints = consumed.size() > 0 || fired.size() > 0;
	const hasComponents = components.size() > 0;
	const hasDeps = dependencies.size() > 0;

	return (
		<textbutton
			AutomaticSize={Enum.AutomaticSize.Y}
			Size={new UDim2(1, 0, 0, 0)}
			BackgroundColor3={BG.surface}
			BorderSizePixel={0}
			Text=""
			Event={{
				Activated: () => {
					if (onSelect) onSelect();
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, RADII.lg)} />
			<uistroke Color={borderColor} Thickness={1} />
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			{/* Header */}
			<frame
				LayoutOrder={0}
				AutomaticSize={Enum.AutomaticSize.Y}
				Size={new UDim2(1, 0, 0, 0)}
				BackgroundColor3={BG.elevated}
				BorderSizePixel={0}
			>
				<uipadding
					PaddingLeft={new UDim(0, SPACING[3])}
					PaddingRight={new UDim(0, SPACING[3])}
					PaddingTop={new UDim(0, SPACING[2])}
					PaddingBottom={new UDim(0, SPACING[2])}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					Padding={new UDim(0, SPACING[2])}
				/>
				{/* Controller icon placeholder */}
				<textlabel
					AutomaticSize={Enum.AutomaticSize.XY}
					BackgroundTransparency={1}
					Text={"[C]"}
					TextColor3={INTEL.c400}
					FontFace={FONTS.mono}
					TextSize={FONT_SIZE.sm}
					Size={UDim2.fromOffset(0, 0)}
				/>
				{/* Name */}
				<textlabel
					AutomaticSize={Enum.AutomaticSize.XY}
					BackgroundTransparency={1}
					Text={name}
					TextColor3={TEXT.primary}
					FontFace={new Font(FONTS.mono.Family, Enum.FontWeight.Bold)}
					TextSize={FONT_SIZE.sm}
					Size={UDim2.fromOffset(0, 0)}
				/>
				{/* Spacer */}
				<frame Size={new UDim2(1, 0, 0, 0)} BackgroundTransparency={1}>
					<uiflexitem FlexMode={Enum.UIFlexMode.Fill} />
				</frame>
				{/* Domain chip */}
				<frame
					AutomaticSize={Enum.AutomaticSize.XY}
					BackgroundColor3={BG.deep}
					BorderSizePixel={0}
					Size={UDim2.fromOffset(0, 0)}
				>
					<uicorner CornerRadius={new UDim(0, RADII.md)} />
					<uistroke Color={BORDER.subtle} Thickness={1} />
					<uipadding
						PaddingLeft={new UDim(0, 6)}
						PaddingRight={new UDim(0, 6)}
						PaddingTop={new UDim(0, 2)}
						PaddingBottom={new UDim(0, 2)}
					/>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						VerticalAlignment={Enum.VerticalAlignment.Center}
						Padding={new UDim(0, 4)}
					/>
					<frame
						Size={UDim2.fromOffset(8, 8)}
						BackgroundColor3={domain.color}
						BorderSizePixel={0}
					>
						<uicorner CornerRadius={new UDim(1, 0)} />
					</frame>
					<textlabel
						AutomaticSize={Enum.AutomaticSize.XY}
						BackgroundTransparency={1}
						Text={domain.name}
						TextColor3={TEXT.tertiary}
						FontFace={FONTS.mono}
						TextSize={9}
						Size={UDim2.fromOffset(0, 0)}
					/>
				</frame>
				{/* Status badge */}
				<StatusBadge status={status} />
			</frame>

			{/* Body */}
			<frame
				LayoutOrder={1}
				AutomaticSize={Enum.AutomaticSize.Y}
				Size={new UDim2(1, 0, 0, 0)}
				BackgroundTransparency={1}
			>
				<uipadding
					PaddingLeft={new UDim(0, SPACING[3])}
					PaddingRight={new UDim(0, SPACING[3])}
					PaddingTop={new UDim(0, SPACING[2])}
					PaddingBottom={new UDim(0, SPACING[2])}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					SortOrder={Enum.SortOrder.LayoutOrder}
					Padding={new UDim(0, SPACING[2])}
				/>

				{/* Description */}
				<textlabel
					LayoutOrder={0}
					AutomaticSize={Enum.AutomaticSize.Y}
					Size={new UDim2(1, 0, 0, 0)}
					BackgroundTransparency={1}
					Text={description}
					TextColor3={TEXT.secondary}
					FontFace={FONTS.body}
					TextSize={11}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>

				{/* Endpoints */}
				{hasEndpoints && (
					<frame
						LayoutOrder={1}
						AutomaticSize={Enum.AutomaticSize.Y}
						Size={new UDim2(1, 0, 0, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							SortOrder={Enum.SortOrder.LayoutOrder}
							Padding={new UDim(0, 2)}
						/>
						{consumed.map((ep, i) => (
							<EndpointRow key={`c-${ep.id}`} ep={ep} />
						))}
						{fired.map((ep, i) => (
							<EndpointRow key={`f-${ep.id}`} ep={ep} />
						))}
					</frame>
				)}

				{/* Components */}
				{hasComponents && (
					<frame
						LayoutOrder={2}
						AutomaticSize={Enum.AutomaticSize.Y}
						Size={new UDim2(1, 0, 0, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Horizontal}
							VerticalAlignment={Enum.VerticalAlignment.Center}
							Padding={new UDim(0, 6)}
							Wraps={true}
						/>
						{components.map((comp) => (
							<Chip
								key={comp.name}
								text={comp.name}
								dotColor={STATUS_DOT_COLOR[comp.status] ?? TEXT.tertiary}
							/>
						))}
					</frame>
				)}

				{/* Dependencies */}
				{hasDeps && (
					<frame
						LayoutOrder={3}
						AutomaticSize={Enum.AutomaticSize.Y}
						Size={new UDim2(1, 0, 0, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Horizontal}
							VerticalAlignment={Enum.VerticalAlignment.Center}
							Padding={new UDim(0, 6)}
							Wraps={true}
						/>
						{dependencies.map((dep) => (
							<Chip key={dep} text={dep} />
						))}
					</frame>
				)}
			</frame>
		</textbutton>
	);
}

export default ControllerCard;
