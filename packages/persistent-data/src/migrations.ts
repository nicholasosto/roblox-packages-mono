import { BasePlayerProfile, Migration, MigrationMap } from "./types";

export function migrateProfile<T extends BasePlayerProfile>(
	data: T,
	migrations: MigrationMap<T>,
	currentVersion: number,
): T {
	if (data.version === undefined || data.version < 1) {
		data.version = 1;
	}

	let current = data;
	while (current.version < currentVersion) {
		const nextVersion = current.version + 1;
		const migrator = migrations.get(nextVersion);
		if (migrator !== undefined) {
			current = migrator(current);
		}
		current.version = nextVersion;
	}

	return current;
}

export function buildMigrationMap<T extends BasePlayerProfile>(
	entries: Map<number, Migration<T>>,
): MigrationMap<T> {
	return entries;
}
