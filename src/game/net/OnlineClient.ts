import { decodeMessage, encodeMessage, type ServerToClient } from "./protocol";

export class OnlineClient {
  private ws: WebSocket | null = null;
  private lastState: ServerToClient | null = null;
  private seq = 0;

  constructor(
    private url: string,
    private roomId: string,
    private playerId: string
  ) {}

  connect(): void {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.ws?.send(
        encodeMessage({
          v: 1,
          type: "join",
          roomId: this.roomId,
          playerId: this.playerId
        })
      );
    };
    this.ws.onmessage = (ev) => {
      const msg = decodeMessage(String(ev.data));
      if (msg.type === "state") this.lastState = msg;
    };
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  sendInput(side: "left" | "right"): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.seq += 1;
    this.ws.send(
      encodeMessage({
        v: 1,
        type: "input",
        roomId: this.roomId,
        playerId: this.playerId,
        seq: this.seq,
        side,
        clientTimeMs: Math.floor(performance.now())
      })
    );
  }

  getState(): ServerToClient | null {
    return this.lastState;
  }
}
