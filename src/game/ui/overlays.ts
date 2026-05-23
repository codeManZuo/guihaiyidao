export type Overlays = {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  menu: HTMLDivElement;
  menuSingleBtn: HTMLButtonElement;
  menuOnlineBtn: HTMLButtonElement;
  menuRoomInput: HTMLInputElement;
  menuPlayerSelect: HTMLSelectElement;
  hud: HTMLDivElement;
  result: HTMLDivElement;
  resultScore: HTMLSpanElement;
  resultRestartBtn: HTMLButtonElement;
  resultMenuBtn: HTMLButtonElement;
  singleHud: HTMLDivElement;
  timeFill: HTMLDivElement;
  scoreValue: HTMLSpanElement;
  onlineHud: HTMLDivElement;
  onlineRoom: HTMLSpanElement;
  onlineP1Score: HTMLSpanElement;
  onlineP1TimeFill: HTMLDivElement;
  onlineP2Score: HTMLSpanElement;
  onlineP2TimeFill: HTMLDivElement;
};

export function createOverlays(doc: Document): Overlays {
  const root = doc.createElement("div");
  root.className = "game-root";

  const canvas = doc.createElement("canvas");
  canvas.className = "game-canvas";

  const menu = doc.createElement("div");
  menu.className = "overlay overlay-menu";

  const title = doc.createElement("div");
  title.className = "menu-title";
  title.textContent = "归海一刀";

  const singleBtn = doc.createElement("button");
  singleBtn.type = "button";
  singleBtn.className = "menu-btn";
  singleBtn.textContent = "单人";
  singleBtn.dataset.action = "menu.single";

  const onlineForm = doc.createElement("div");
  onlineForm.className = "menu-online-form";

  const roomLabel = doc.createElement("label");
  roomLabel.className = "menu-label";
  roomLabel.textContent = "房间号";
  const roomInput = doc.createElement("input");
  roomInput.className = "menu-input";
  roomInput.value = "ABCD";
  roomInput.inputMode = "text";
  roomInput.autocapitalize = "characters";
  roomInput.autocomplete = "off";
  roomInput.spellcheck = false;
  roomLabel.appendChild(roomInput);

  const playerLabel = doc.createElement("label");
  playerLabel.className = "menu-label";
  playerLabel.textContent = "玩家";
  const playerSelect = doc.createElement("select");
  playerSelect.className = "menu-select";
  const optP1 = doc.createElement("option");
  optP1.value = "p1";
  optP1.textContent = "P1";
  const optP2 = doc.createElement("option");
  optP2.value = "p2";
  optP2.textContent = "P2";
  playerSelect.append(optP1, optP2);
  playerLabel.appendChild(playerSelect);

  const onlineBtn = doc.createElement("button");
  onlineBtn.type = "button";
  onlineBtn.className = "menu-btn";
  onlineBtn.textContent = "在线双人";
  onlineBtn.dataset.action = "menu.online";

  onlineForm.append(roomLabel, playerLabel);
  menu.append(title, singleBtn, onlineForm, onlineBtn);

  const hud = doc.createElement("div");
  hud.className = "overlay overlay-hud";

  const singleHud = doc.createElement("div");
  singleHud.className = "hud-single";

  const score = doc.createElement("div");
  score.className = "hud-score";
  score.textContent = "分数 ";
  const scoreValue = doc.createElement("span");
  scoreValue.textContent = "0";
  score.appendChild(scoreValue);

  const timeBar = doc.createElement("div");
  timeBar.className = "hud-time";
  const timeFill = doc.createElement("div");
  timeFill.className = "hud-time-fill";
  timeFill.dataset.testid = "time-fill";
  timeFill.setAttribute("style", "width: 100%");
  timeBar.appendChild(timeFill);

  singleHud.append(score, timeBar);

  const onlineHud = doc.createElement("div");
  onlineHud.className = "hud-online";

  const roomLine = doc.createElement("div");
  roomLine.className = "hud-room";
  roomLine.textContent = "房间 ";
  const onlineRoom = doc.createElement("span");
  onlineRoom.textContent = "----";
  roomLine.appendChild(onlineRoom);

  const p1 = doc.createElement("div");
  p1.className = "hud-player hud-player-p1";
  p1.textContent = "P1 ";
  const onlineP1Score = doc.createElement("span");
  onlineP1Score.textContent = "0";
  p1.appendChild(onlineP1Score);
  const p1Bar = doc.createElement("div");
  p1Bar.className = "hud-time";
  const onlineP1TimeFill = doc.createElement("div");
  onlineP1TimeFill.className = "hud-time-fill";
  onlineP1TimeFill.setAttribute("style", "width: 100%");
  p1Bar.appendChild(onlineP1TimeFill);

  const p2 = doc.createElement("div");
  p2.className = "hud-player hud-player-p2";
  p2.textContent = "P2 ";
  const onlineP2Score = doc.createElement("span");
  onlineP2Score.textContent = "0";
  p2.appendChild(onlineP2Score);
  const p2Bar = doc.createElement("div");
  p2Bar.className = "hud-time";
  const onlineP2TimeFill = doc.createElement("div");
  onlineP2TimeFill.className = "hud-time-fill";
  onlineP2TimeFill.setAttribute("style", "width: 100%");
  p2Bar.appendChild(onlineP2TimeFill);

  onlineHud.append(roomLine, p1, p1Bar, p2, p2Bar);

  hud.append(singleHud, onlineHud);

  const result = doc.createElement("div");
  result.className = "overlay overlay-result";
  const resultCard = doc.createElement("div");
  resultCard.className = "result-card";
  const resultTitle = doc.createElement("div");
  resultTitle.className = "result-title";
  resultTitle.textContent = "失败";
  const resultLine = doc.createElement("div");
  resultLine.className = "result-line";
  resultLine.textContent = "分数 ";
  const resultScore = doc.createElement("span");
  resultScore.textContent = "0";
  resultLine.appendChild(resultScore);
  const resultActions = doc.createElement("div");
  resultActions.className = "result-actions";
  const restartBtn = doc.createElement("button");
  restartBtn.type = "button";
  restartBtn.className = "menu-btn";
  restartBtn.textContent = "再来一局";
  restartBtn.dataset.action = "result.restart";
  const menuBtn = doc.createElement("button");
  menuBtn.type = "button";
  menuBtn.className = "menu-btn";
  menuBtn.textContent = "返回菜单";
  menuBtn.dataset.action = "nav.menu";
  resultActions.append(restartBtn, menuBtn);
  resultCard.append(resultTitle, resultLine, resultActions);
  result.appendChild(resultCard);

  root.append(canvas, menu, hud, result);

  const overlays: Overlays = {
    root,
    canvas,
    menu,
    menuSingleBtn: singleBtn,
    menuOnlineBtn: onlineBtn,
    menuRoomInput: roomInput,
    menuPlayerSelect: playerSelect,
    hud,
    result,
    resultScore,
    resultRestartBtn: restartBtn,
    resultMenuBtn: menuBtn,
    singleHud,
    timeFill,
    scoreValue,
    onlineHud,
    onlineRoom,
    onlineP1Score,
    onlineP1TimeFill,
    onlineP2Score,
    onlineP2TimeFill
  };
  showMenu(overlays);
  return overlays;
}

export function showMenu(overlays: Overlays): void {
  overlays.menu.style.display = "flex";
  overlays.hud.style.display = "none";
  overlays.result.style.display = "none";
}

export function showHudSingle(overlays: Overlays, params: { score: number; timeRatio01: number }): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "flex";
  overlays.result.style.display = "none";
  overlays.singleHud.style.display = "flex";
  overlays.onlineHud.style.display = "none";
  overlays.scoreValue.textContent = String(params.score);
  const pct = Math.round(Math.max(0, Math.min(1, params.timeRatio01)) * 100);
  overlays.timeFill.setAttribute("style", `width: ${pct}%`);
}

export function showHudOnline(
  overlays: Overlays,
  params: {
    roomId: string;
    p1: { score: number; timeRatio01: number; status: "alive" | "dead" };
    p2: { score: number; timeRatio01: number; status: "alive" | "dead" };
  }
): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "flex";
  overlays.result.style.display = "none";
  overlays.singleHud.style.display = "none";
  overlays.onlineHud.style.display = "flex";

  overlays.onlineRoom.textContent = params.roomId;
  overlays.onlineP1Score.textContent = String(params.p1.score);
  overlays.onlineP2Score.textContent = String(params.p2.score);

  const p1Pct = Math.round(Math.max(0, Math.min(1, params.p1.timeRatio01)) * 100);
  const p2Pct = Math.round(Math.max(0, Math.min(1, params.p2.timeRatio01)) * 100);
  overlays.onlineP1TimeFill.setAttribute("style", `width: ${p1Pct}%`);
  overlays.onlineP2TimeFill.setAttribute("style", `width: ${p2Pct}%`);

  overlays.onlineHud.style.opacity = params.p1.status === "dead" && params.p2.status === "dead" ? "0.8" : "1";
}

export function showResult(overlays: Overlays, params: { score: number }): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "none";
  overlays.result.style.display = "flex";
  overlays.resultScore.textContent = String(params.score);
}
