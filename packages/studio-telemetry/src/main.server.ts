import { startFlushLoop } from './http/client';
import { startPolling } from './util/polling';
import { startLogRelay } from './channels/log-relay';
import { startGameStateChannel } from './channels/game-state';
import { startPerformanceChannel } from './channels/performance';
import { startEntityDataChannel } from './channels/entity-data';
import { startCatalogChannel } from './channels/catalog';
import { startSessionChannel } from './channels/session';

// Start the HTTP flush loop
startFlushLoop();

// Wire up all telemetry channels
startLogRelay();
startGameStateChannel();
startPerformanceChannel();
startEntityDataChannel();
startCatalogChannel();
startSessionChannel();

// Start the Heartbeat-driven polling scheduler
startPolling();

print('[TrembusStudioTelemetry] Telemetry relay loaded — streaming to http://127.0.0.1:4320');
