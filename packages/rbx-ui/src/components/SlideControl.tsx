/**
 * SlideControl — Cross-platform component (Roblox implementation)
 *
 * A general-purpose slider/range input with drag thumb + click-to-jump.
 * Uses manual input handling (InputBegan/InputChanged/InputEnded) for
 * drag interaction — UIDragDetector conflicts with React's position control.
 *
 * Web equivalent: packages/ui-library/src/components/SlideControl.tsx
 */

import React, { useState, useRef, useEffect } from "@rbxts/react";
import { UserInputService } from "@rbxts/services";
import {
	BG, BORDER, TEXT, FONTS, FONT_SIZE, SPACING, RADII, AMBER,
	withAlpha,
} from "../design-system/Tokens";

// ── Types ──────────────────────────────────────────────────

export interface SlideControlProps {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
	showValue?: boolean;
	accentColor?: Color3;
	size?: "sm" | "md";
	disabled?: boolean;
	onChange?: (value: number) => void;
}

// ── Helpers ────────────────────────────────────────────────

function snapValue(raw: number, min: number, max: number, step: number): number {
	const snapped = math.round((raw - min) / step) * step + min;
	return math.clamp(snapped, min, max);
}

function calcValueFromX(mouseX: number, track: Frame, min: number, max: number, step: number): number {
	const trackLeft = track.AbsolutePosition.X;
	const trackWidth = track.AbsoluteSize.X;
	const rawFraction = math.clamp((mouseX - trackLeft) / trackWidth, 0, 1);
	const rawValue = rawFraction * (max - min) + min;
	return snapValue(rawValue, min, max, step);
}

// ── Constants ──────────────────────────────────────────────

const TRACK_HEIGHT_SM = 4;
const TRACK_HEIGHT_MD = 8;
const THUMB_SIZE_SM = 14;
const THUMB_SIZE_MD = 20;
const LABEL_HEIGHT = 18;

// ── Component ──────────────────────────────────────────────

function SlideControl({
	value,
	min = 0,
	max = 100,
	step = 1,
	label,
	showValue = true,
	accentColor = AMBER.c400,
	size = "md",
	disabled = false,
	onChange,
}: SlideControlProps) {
	const trackH = size === "sm" ? TRACK_HEIGHT_SM : TRACK_HEIGHT_MD;
	const thumbSize = size === "sm" ? THUMB_SIZE_SM : THUMB_SIZE_MD;
	const hasLabel = label !== undefined || showValue;
	const totalH = (hasLabel ? LABEL_HEIGHT + SPACING[1] : 0) + math.max(trackH, thumbSize);

	// Internal state — allows uncontrolled usage (static value prop)
	const [internalValue, setInternalValue] = useState(value);
	const trackRef = useRef<Frame>();
	const [dragging, setDragging] = useState(false);

	// Sync internal state when value prop changes externally
	useEffect(() => {
		if (!dragging) setInternalValue(value);
	}, [value]);

	const currentValue = internalValue;
	const fraction = max > min ? (currentValue - min) / (max - min) : 0;

	const applyValue = (newVal: number) => {
		if (newVal !== currentValue) {
			setInternalValue(newVal);
			onChange?.(newVal);
		}
	};

	// Global mouse tracking during drag
	useEffect(() => {
		if (!dragging) return;

		const moveConn = UserInputService.InputChanged.Connect((input) => {
			if (input.UserInputType !== Enum.UserInputType.MouseMovement &&
				input.UserInputType !== Enum.UserInputType.Touch) return;
			const track = trackRef.current;
			if (!track) return;
			const newVal = calcValueFromX(input.Position.X, track, min, max, step);
			applyValue(newVal);
		});

		const upConn = UserInputService.InputEnded.Connect((input) => {
			if (input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch) {
				setDragging(false);
			}
		});

		return () => {
			moveConn.Disconnect();
			upConn.Disconnect();
		};
	}, [dragging, min, max, step, currentValue, onChange]);

	// Start drag on track or thumb click
	const handleInputBegan = (rbx: Frame, input: InputObject) => {
		if (disabled) return;
		if (input.UserInputType !== Enum.UserInputType.MouseButton1 &&
			input.UserInputType !== Enum.UserInputType.Touch) return;

		setDragging(true);
		const track = trackRef.current;
		if (!track) return;
		const newVal = calcValueFromX(input.Position.X, track, min, max, step);
		applyValue(newVal);
	};

	return (
		<frame
			Size={new UDim2(1, 0, 0, totalH)}
			BackgroundTransparency={1}
		>
			{/* Label row */}
			{hasLabel && (
				<frame
					Size={new UDim2(1, 0, 0, LABEL_HEIGHT)}
					Position={new UDim2(0, 0, 0, 0)}
					BackgroundTransparency={1}
				>
					{label !== undefined && (
						<textlabel
							Text={string.upper(label)}
							Size={new UDim2(0.5, 0, 1, 0)}
							Position={new UDim2(0, 0, 0, 0)}
							BackgroundTransparency={1}
							TextColor3={disabled ? TEXT.tertiary : TEXT.secondary}
							FontFace={FONTS.display}
							TextSize={FONT_SIZE.xs}
							TextXAlignment={Enum.TextXAlignment.Left}
							TextYAlignment={Enum.TextYAlignment.Center}
						/>
					)}
					{showValue && (
						<textlabel
							Text={tostring(currentValue)}
							Size={new UDim2(0.5, 0, 1, 0)}
							Position={new UDim2(0.5, 0, 0, 0)}
							BackgroundTransparency={1}
							TextColor3={disabled ? TEXT.tertiary : TEXT.primary}
							FontFace={FONTS.mono}
							TextSize={FONT_SIZE.sm}
							TextXAlignment={Enum.TextXAlignment.Right}
							TextYAlignment={Enum.TextYAlignment.Center}
						/>
					)}
				</frame>
			)}

			{/* Track — click to jump + start drag */}
			<frame
				ref={trackRef}
				Size={new UDim2(1, 0, 0, thumbSize)}
				Position={new UDim2(0, 0, 0, hasLabel ? LABEL_HEIGHT + SPACING[1] : 0)}
				BackgroundTransparency={1}
				Active={!disabled}
				Event={{
					InputBegan: (rbx, input) => handleInputBegan(rbx, input),
				}}
			>
				{/* Visible track bar (centered vertically within hit area) */}
				<frame
					Size={new UDim2(1, 0, 0, trackH)}
					Position={new UDim2(0, 0, 0.5, -trackH / 2)}
					BackgroundColor3={BG.hover}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(0, RADII.full)} />

					{/* Fill */}
					<frame
						Size={new UDim2(fraction, 0, 1, 0)}
						BackgroundColor3={disabled ? TEXT.tertiary : accentColor}
						BorderSizePixel={0}
					>
						<uicorner CornerRadius={new UDim(0, RADII.full)} />
					</frame>
				</frame>

				{/* Thumb — positioned by React, no UIDragDetector */}
				<frame
					Size={new UDim2(0, thumbSize, 0, thumbSize)}
					Position={new UDim2(fraction, -thumbSize / 2, 0, 0)}
					BackgroundColor3={disabled ? TEXT.tertiary : accentColor}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
					<uistroke Color={BG.deep} Thickness={2} />
				</frame>
			</frame>
		</frame>
	);
}

export default SlideControl;
