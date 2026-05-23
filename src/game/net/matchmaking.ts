export function getMatchParams(): {
  mode: "single" | "online";
  roomId: string;
  playerId: "p1" | "p2";
  wsUrl: string;
} {
  const url = new URL(window.location.href);
  const mode = (url.searchParams.get("mode") === "online" ? "online" : "single") as
    | "single"
    | "online";
  const roomId = url.searchParams.get("room") || "ABCD";
  const playerId = (url.searchParams.get("player") === "p2" ? "p2" : "p1") as "p1" | "p2";
  const wsUrl = url.searchParams.get("ws") || "ws://localhost:8787";
  return { mode, roomId, playerId, wsUrl };
}
