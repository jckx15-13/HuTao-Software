export interface ParticleWorkerInitMessage {
  type: 'init';
  width: number;
  height: number;
  count: number;
  speed: number;
}

export interface ParticleWorkerResizeMessage {
  type: 'resize';
  width: number;
  height: number;
}

export interface ParticleWorkerTickMessage {
  type: 'tick';
  deltaMs: number;
  isVisible: boolean;
}

export interface ParticleWorkerStopMessage {
  type: 'stop';
}

export interface ParticleWorkerReleaseBufferMessage {
  type: 'releaseBuffer';
  buffer: ArrayBuffer;
}

export type ParticleWorkerMessage =
  | ParticleWorkerInitMessage
  | ParticleWorkerResizeMessage
  | ParticleWorkerTickMessage
  | ParticleWorkerStopMessage
  | ParticleWorkerReleaseBufferMessage;

export interface ParticleWorkerFrameMessage {
  type: 'frame';
  data: ArrayBuffer;
}

export interface ParticleWorkerReadyMessage {
  type: 'ready';
}

export type ParticleWorkerResponse = ParticleWorkerFrameMessage | ParticleWorkerReadyMessage;
