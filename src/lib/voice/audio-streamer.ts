/**
 * AudioStreamer — reads PCM chunks from a fetch Response stream,
 * converts Int16 → Float32, and plays gapless audio via Web Audio API.
 * Supports instant stop for barge-in.
 */
export class AudioStreamer {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private sources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private playing = false;
  private onCompleteCallback: (() => void) | null = null;
  private pendingChunks = 0;
  private streamDone = false;
  private stopped = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.connect(ctx.destination);
  }

  /** Start streaming PCM from a fetch Response */
  async stream(response: Response): Promise<void> {
    const body = response.body;
    if (!body) throw new Error("Response has no body");

    this.playing = true;
    this.stopped = false;
    this.streamDone = false;
    this.pendingChunks = 0;
    this.nextStartTime = this.ctx.currentTime + 0.05; // tiny lead-in

    const reader = body.getReader();

    // Buffer partial Int16 samples across chunks
    let leftover = new Uint8Array(0);

    try {
      while (true) {
        if (this.stopped) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;
        if (this.stopped) break;

        // Merge leftover bytes with new chunk
        const combined = new Uint8Array(leftover.length + value.length);
        combined.set(leftover);
        combined.set(value, leftover.length);

        // Int16 = 2 bytes per sample; keep any odd trailing byte
        const usableBytes = combined.length - (combined.length % 2);
        leftover = combined.slice(usableBytes);

        if (usableBytes === 0) continue;

        const int16 = new Int16Array(
          combined.buffer,
          combined.byteOffset,
          usableBytes / 2
        );

        // Convert Int16 → Float32
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }

        this.scheduleChunk(float32);
      }
    } catch (err) {
      if (!this.stopped) {
        console.error("AudioStreamer read error:", err);
      }
    }

    this.streamDone = true;
    this.checkComplete();
  }

  private scheduleChunk(float32: Float32Array) {
    const sampleRate = 24000;
    const audioBuffer = this.ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    // Schedule gapless playback
    const startTime = Math.max(this.nextStartTime, this.ctx.currentTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;

    this.pendingChunks++;
    this.sources.push(source);

    source.onended = () => {
      const idx = this.sources.indexOf(source);
      if (idx !== -1) this.sources.splice(idx, 1);
      this.pendingChunks--;
      this.checkComplete();
    };
  }

  private checkComplete() {
    if (this.streamDone && this.pendingChunks <= 0 && !this.stopped) {
      this.playing = false;
      this.onCompleteCallback?.();
    }
  }

  /** Stop all audio immediately (barge-in) */
  stop() {
    this.stopped = true;
    this.playing = false;
    for (const source of this.sources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // already stopped
      }
    }
    this.sources = [];
    this.pendingChunks = 0;
  }

  /** Register callback for when all audio finishes playing */
  onComplete(cb: () => void) {
    this.onCompleteCallback = cb;
  }

  get isPlaying() {
    return this.playing;
  }
}
