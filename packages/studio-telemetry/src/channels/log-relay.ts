import { LogService } from '@rbxts/services';
import { enqueue } from '../http/client';

/** Connect to LogService.MessageOut and forward all console output. */
export function startLogRelay(): void {
  LogService.MessageOut.Connect((message, messageType) => {
    enqueue({
      channel: 'log',
      timestamp: os.time(),
      data: {
        message,
        messageType: messageType.Value,
        timestamp: os.time(),
      },
    });
  });
}
