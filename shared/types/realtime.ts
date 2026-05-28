export type ConnectionStatus =
  | 'creating'
  | 'waiting_qr'
  | 'connecting'
  | 'open'
  | 'close'
  | 'disconnected'
  | 'unknown';

export type TeamRoomEvent =
  | 'new-message'
  | 'chat-list-update'
  | 'connection-status'
  | 'qr-update-needed'
  | 'message-reaction'
  | 'typing';

export interface TeamRealtimeEnvelope<T = unknown> {
  room: string;
  event: TeamRoomEvent;
  data: T;
}
