export type AudioCategory = "sfx" | "music" | "ambient" | "ui";

export interface SoundConfig {
	soundId: string;
	volume?: number;
	category?: AudioCategory;
	looped?: boolean;
	pitch?: number;
}

export interface MusicTrack {
	soundId: string;
	name?: string;
	volume?: number;
	looped?: boolean;
}

export interface AudioSettings {
	masterVolume: number;
	categoryVolumes: Map<AudioCategory, number>;
	muted: boolean;
}

export interface CrossfadeConfig {
	duration?: number;
	style?: "linear" | "smooth";
}
