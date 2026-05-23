export type FlowState =
  | { screen: "menu" }
  | { screen: "leaderboard" }
  | { screen: "single" }
  | {
      screen: "online";
      mode: "lobby" | "playing" | "result";
      roomId: string;
    };

export type FlowAction =
  | { type: "menu.single" }
  | { type: "menu.online" }
  | { type: "nav.menu" }
  | { type: "nav.leaderboard" }
  | { type: "online.playing" }
  | { type: "online.result" };

export function createInitialFlow(params: { url: string }): FlowState {
  void params.url;
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
        roomId: ""
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
