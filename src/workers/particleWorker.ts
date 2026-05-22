import type {
  ParticleWorkerFrameMessage,
  ParticleWorkerMessage,
  ParticleWorkerResponse,
} from '../types/particleWorker';

const workerScope = self as unknown as Worker;

interface ParticleState {
  width: number;
  height: number;
  positions: Float32Array;
  velocity: Float32Array;
  radius: Float32Array;
  alpha: Float32Array;
}

const MIN_DT = 0.5;
const MAX_DT = 2.5;
const BASE_FRAME_MS = 16.6667;

let state: ParticleState | null = null;

function createState(width: number, height: number, count: number, speed: number): ParticleState {
  const positions = new Float32Array(count * 2);
  const velocity = new Float32Array(count * 2);
  const radius = new Float32Array(count);
  const alpha = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const xIdx = i * 2;
    const yIdx = xIdx + 1;
    positions[xIdx] = Math.random() * width;
    positions[yIdx] = Math.random() * height;
    velocity[xIdx] = (Math.random() - 0.5) * speed;
    velocity[yIdx] = (Math.random() - 0.5) * speed;
    radius[i] = Math.random() * 1.5 + 0.5;
    alpha[i] = Math.random() * 0.5 + 0.1;
  }

  return { width, height, positions, velocity, radius, alpha };
}

function step(deltaMs: number) {
  if (!state) return;

  const dtFactor = Math.max(MIN_DT, Math.min(MAX_DT, deltaMs / BASE_FRAME_MS));
  const count = state.radius.length;

  for (let i = 0; i < count; i += 1) {
    const xIdx = i * 2;
    const yIdx = xIdx + 1;
    state.positions[xIdx] += state.velocity[xIdx] * dtFactor;
    state.positions[yIdx] += state.velocity[yIdx] * dtFactor;

    if (state.positions[xIdx] < 0) state.positions[xIdx] = state.width;
    if (state.positions[xIdx] > state.width) state.positions[xIdx] = 0;
    if (state.positions[yIdx] < 0) state.positions[yIdx] = state.height;
    if (state.positions[yIdx] > state.height) state.positions[yIdx] = 0;
  }
}

const bufferPool: ArrayBuffer[] = [];

function toFrameBuffer() {
  if (!state) return new ArrayBuffer(0);

  const count = state.radius.length;
  const byteLength = count * 4 * 4; // count * 4 floats * 4 bytes per float

  let buffer = bufferPool.pop();
  if (!buffer || buffer.byteLength !== byteLength) {
    buffer = new ArrayBuffer(byteLength);
  }

  const frame = new Float32Array(buffer);
  for (let i = 0; i < count; i += 1) {
    const srcIdx = i * 2;
    const dstIdx = i * 4;
    frame[dstIdx] = state.positions[srcIdx];
    frame[dstIdx + 1] = state.positions[srcIdx + 1];
    frame[dstIdx + 2] = state.radius[i];
    frame[dstIdx + 3] = state.alpha[i];
  }

  return buffer;
}

workerScope.onmessage = (event: MessageEvent<ParticleWorkerMessage>) => {
  const message = event.data;

  if (message.type === 'releaseBuffer') {
    bufferPool.push(message.buffer);
    return;
  }

  if (message.type === 'init') {
    state = createState(message.width, message.height, message.count, message.speed);
    const ready: ParticleWorkerResponse = { type: 'ready' };
    workerScope.postMessage(ready);
    return;
  }

  if (!state) return;

  if (message.type === 'resize') {
    state.width = message.width;
    state.height = message.height;
    return;
  }

  if (message.type === 'stop') {
    state = null;
    bufferPool.length = 0; // Clear references to free memory
    return;
  }

  if (message.type === 'tick') {
    if (!message.isVisible) return;
    step(message.deltaMs);
    const data = toFrameBuffer();
    const frame: ParticleWorkerFrameMessage = { type: 'frame', data };
    (workerScope.postMessage as (message: unknown, transfer: Transferable[]) => void)(frame, [data]);
  }
};
