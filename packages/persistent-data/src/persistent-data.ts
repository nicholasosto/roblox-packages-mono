import ProfileStore from "@rbxts/profile-store";
import { BasePlayerProfile, MigrationMap } from "./types";
import { migrateProfile } from "./migrations";
import { DEFAULT_STORE_NAME, CURRENT_SCHEMA_VERSION, PROFILE_KEY_PREFIX } from "./constants";

export interface PersistentDataManagerConfig<T extends BasePlayerProfile> {
	migrations?: MigrationMap<T>;
	currentVersion?: number;
	/** Per-slice migration hook from `composeProfile()`. Runs after global migrations + Reconcile. */
	onLoad?: (data: T) => T;
}

export class PersistentDataManager<T extends BasePlayerProfile> {
	private store: ProfileStore.Store<T>;
	private activeProfiles = new Map<number, ProfileStore.Profile<T>>();
	private migrations: MigrationMap<T>;
	private currentVersion: number;
	private onLoad?: (data: T) => T;

	constructor(
		storeName: string = DEFAULT_STORE_NAME,
		template: T,
		config?: PersistentDataManagerConfig<T>,
	) {
		this.store = ProfileStore.New(storeName, template);
		this.migrations = config?.migrations ?? new Map();
		this.currentVersion = config?.currentVersion ?? CURRENT_SCHEMA_VERSION;
		this.onLoad = config?.onLoad;
	}

	loadProfile(player: Player): void {
		task.spawn(() => {
			const profileKey = `${PROFILE_KEY_PREFIX}${player.UserId}`;
			const profile = this.store.StartSessionAsync(profileKey);

			if (profile === undefined) {
				warn(`[PersistentData] Failed to load profile for ${player.DisplayName} (${player.UserId})`);
				player.Kick("[PersistentData] Unable to load your data. Please rejoin.");
				return;
			}

			if (!player.IsDescendantOf(game)) {
				profile.EndSession();
				return;
			}

			profile.AddUserId(player.UserId);

			if (this.migrations.size() > 0) {
				profile.Data = migrateProfile(profile.Data, this.migrations, this.currentVersion);
			}

			profile.Reconcile();

			// Run per-slice migrations (from composeProfile) after reconcile
			if (this.onLoad !== undefined) {
				profile.Data = this.onLoad(profile.Data);
			}

			profile.Data.displayName = player.DisplayName;
			profile.Data.lastLogin = os.time();
			if (profile.Data.firstJoin === 0) {
				profile.Data.firstJoin = os.time();
			}

			profile.OnSessionEnd.Connect(() => {
				this.activeProfiles.delete(player.UserId);
				if (player.IsDescendantOf(game)) {
					player.Kick("[PersistentData] Your session was ended by another server. Please rejoin.");
				}
			});

			this.activeProfiles.set(player.UserId, profile);
			print(`[PersistentData] Loaded profile for ${player.DisplayName} (${player.UserId})`);
		});
	}

	releaseProfile(player: Player): void {
		const profile = this.activeProfiles.get(player.UserId);
		if (profile === undefined) {
			return;
		}

		if (profile.IsActive()) {
			const sessionTime = os.time() - profile.Data.lastLogin;
			profile.Data.playtime += sessionTime;
			profile.EndSession();
		}

		this.activeProfiles.delete(player.UserId);
		print(`[PersistentData] Released profile for ${player.DisplayName} (${player.UserId})`);
	}

	getProfile(player: Player): T | undefined {
		const profile = this.activeProfiles.get(player.UserId);
		if (profile === undefined || !profile.IsActive()) {
			return undefined;
		}
		return profile.Data;
	}

	modifyData(player: Player, callback: (data: T) => void): boolean {
		const profile = this.activeProfiles.get(player.UserId);
		if (profile === undefined) {
			warn(`[PersistentData] modifyData: no active profile for ${player.DisplayName}`);
			return false;
		}
		if (!profile.IsActive()) {
			warn(`[PersistentData] modifyData: session inactive for ${player.DisplayName}`);
			return false;
		}
		callback(profile.Data);
		return true;
	}

	releaseAll(): void {
		this.activeProfiles.forEach((profile) => {
			if (profile.IsActive()) {
				profile.EndSession();
			}
		});
		this.activeProfiles.clear();
		print("[PersistentData] All sessions released (game closing)");
	}

	getActiveCount(): number {
		return this.activeProfiles.size();
	}
}
