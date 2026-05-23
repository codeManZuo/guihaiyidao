export type PlayerId = "p1" | "p2";

export type FlowState =
  | { screen: "menu" }
  | { screen: "leaderboard" }
  | { screen: "single" }
  | {
      screen: "online";
      mode: "lobby" | "playing" | "result";
      roomId: string;
      playerId: PlayerId;
      wsUrl: string;
    };

export type FlowAction =
  | { type: "menu.single" }
  | { type: "menu.online"; roomId: string; playerId: PlayerId; wsUrl: string }
  | { type: "nav.menu" }
  | { type: "nav.leaderboard" }
  | { type: "online.playing" }
  | { type: "online.result" };

export function createInitialFlow(params: { url: string }): FlowState {
  const url = new URL(params.url);
  const mode = url.searchParams.get("mode");
  if (mode === "online") {
    const roomId = url.searchParams.get("room") || "ABCD";
    const playerId = (url.searchParams.get("player") === "p2" ? "p2" : "p1") as PlayerId;
    const wsUrl = url.searchParams.get("ws") || "ws://localhost:8787";
    return { screen: "online", mode: "lobby", roomId, playerId, wsUrl };
  }
  return { screen: "menu" };
}

export function reduceFlow(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "menu.single":
      return { screen: "single" };
    case "menu.online":
      return {
        screen: "online",
        mode: "lobby",
        roomId: action.roomId,
        playerId: action.playerId,
        wsUrl: action.wsUrl
      };
    case "nav.menu":
      return { screen: "menu" };
    case "nav.leaderboard":
      return { screen: "leaderboard" };
    case "online.playing":
      if (state.screen !== "online") return state;
      return { ...state, mode: "playing" };
    case "online.result":
      if (state.screen !== "online") return state;
      return { ...state, mode: "result" };
    default:
      return state;
  }
}
