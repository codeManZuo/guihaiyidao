import { decodeMessage, encodeMessage, type CreateRoomV2, type Difficulty, type ErrorMessageV2, type JoinResultV2, type RoomsListV2, type StateMessageV2, type WireMessage } from "./protocol";
import type { Side } from "../state/types";

type WebSocketLike = {
  readyState: number;
  bufferedAmount?: number;
  send(data: string): void;
  close(): void;
  onopen: null | (() => void);
  onmessage: null | ((ev: { data: unknown }) => void);
  onclose: null | (() => void);
};

export class OnlineClient {
  private ws: WebSocketLike | null = null;
  private pending: string[] = [];
  private inputOutbox: string[] = [];
  private flushInputTimer: ReturnType<typeof setTimeout> | null = null;
  private joined: { roomId: string; playerId: "p1" | "p2"; isHost: boolean } | null = null;
  private lastState: StateMessageV2 | null = null;
  private lastError: ErrorMessageV2 | null = null;
  private lastRoomsList: { prefix: string; roomIds: string[] } | null = null;
  private seq = 0;

  constructor(
    private params: {
      url: string;
      wsFactory?: (url: string) => WebSocketLike;
      nowMs?: () => number;
      perfNowMs?: () => number;
    }
  ) {}

  connect(): void {
    if (this.ws) return;
    const wsFactory = this.params.wsFactory ?? ((url) => new WebSocket(url) as any);
    const ws = wsFactory(this.params.url);
    this.ws = ws;

    ws.onopen = () => {
      this.flushPending();
      this.scheduleFlushInput(0);
    };
    ws.onmessage = (ev: { data: unknown }) => {
      const msg = decodeMessage(String(ev.data)) as WireMessage;
      if (msg.type === "joined") {
        const j = msg as JoinResultV2;
        this.joined = { roomId: j.roomId, playerId: j.playerId, isHost: j.isHost };
      }
      if (msg.type === "state") this.lastState = msg as StateMessageV2;
      if (msg.type === "rooms_list") {
        const list = msg as RoomsListV2;
        this.lastRoomsList = { prefix: list.prefix, roomIds: list.roomIds };
      }
      if (msg.type === "error") this.lastError = msg as ErrorMessageV2;
    };
    ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.pending = [];
    this.inputOutbox = [];
    this.flushInputTimer = null;
    this.lastRoomsList = null;
  }

  createRoom(params: { roomId?: string; difficulty: Difficulty }): void {
    const msg: CreateRoomV2 = {
      v: 2,
      type: "create_room",
      difficulty: params.difficulty,
      ...(typeof params.roomId === "string" && params.roomId.length > 0 ? { roomId: params.roomId } : {})
    };
    this.sendOrQueue(encodeMessage(msg));
  }

  joinRoom(roomId: string): void {
    this.sendOrQueue(encodeMessage({ v: 2, type: "join_room", roomId }));
  }

  queryRooms(prefix: string): void {
    this.sendOrQueue(encodeMessage({ v: 2, type: "rooms_query", prefix }));
  }

  setReady(): void {
    const roomId = this.joined?.roomId;
    if (!roomId) return;
    this.sendOrQueue(encodeMessage({ v: 2, type: "ready", roomId }));
  }

  start(): void {
    const roomId = this.joined?.roomId;
    if (!roomId) return;
    this.sendOrQueue(encodeMessage({ v: 2, type: "start", roomId }));
  }

  sendInput(side: Side): void {
    const roomId = this.joined?.roomId;
    if (!roomId) return;
    this.seq += 1;
    const perfNowMs = this.params.perfNowMs ?? (() => performance.now());
    this.inputOutbox.push(
      encodeMessage({
        v: 2,
        type: "input",
        roomId,
        seq: this.seq,
        side,
        clientTimeMs: Math.floor(perfNowMs())
      })
    );
    this.scheduleFlushInput(0);
  }

  getJoined(): { roomId: string; playerId: "p1" | "p2"; isHost: boolean } | null {
    return this.joined;
  }

  getState(): StateMessageV2 | null {
    return this.lastState;
  }

  getError(): ErrorMessageV2 | null {
    return this.lastError;
  }

  getRoomsList(): { prefix: string; roomIds: string[] } | null {
    return this.lastRoomsList;
  }

  clearError(): void {
    this.lastError = null;
  }

  private sendOrQueue(raw: string): void {
    if (!this.ws || this.ws.readyState !== 1) {
      this.pending.push(raw);
      return;
    }
    this.ws.send(raw);
  }

  private flushPending(): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    const pending = this.pending;
    this.pending = [];
    for (const raw of pending) this.ws.send(raw);
  }

  private scheduleFlushInput(delayMs: number): void {
    if (this.flushInputTimer) return;
    this.flushInputTimer = setTimeout(() => {
      this.flushInputTimer = null;
      this.flushInput();
    }, delayMs);
  }

  private flushInput(): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1) return;
    if (this.inputOutbox.length === 0) return;

    const maxBufferedAmount = 64 * 1024;
    const maxSendsPerFlush = 6;
    let sent = 0;
    let delayMs = 0;

    while (this.inputOutbox.length > 0 && sent < maxSendsPerFlush) {
      const buffered = ws.bufferedAmount ?? 0;
      if (buffered > maxBufferedAmount) {
        delayMs = 50;
        break;
      }
      const raw = this.inputOutbox.shift();
      if (!raw) break;
      ws.send(raw);
      sent += 1;
    }

    if (this.inputOutbox.length > 0) this.scheduleFlushInput(delayMs);
  }
}
