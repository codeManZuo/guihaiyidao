export type Overlays = {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  menu: HTMLDivElement;
  menuSingleBtn: HTMLButtonElement;
  menuCreateRoomBtn: HTMLButtonElement;
  menuJoinRoomBtn: HTMLButtonElement;
  menuLeaderboardBtn: HTMLButtonElement;
  menuRoomInput: HTMLInputElement;
  menuOnlineDifficultySelect: HTMLSelectElement;
  menuDifficultySelect: HTMLSelectElement;
  menuChopSoundSelect: HTMLSelectElement;
  menuChopSoundTestBtn: HTMLButtonElement;
  hud: HTMLDivElement;
  leaderboard: HTMLDivElement;
  leaderboardEasyBtn: HTMLButtonElement;
  leaderboardNormalBtn: HTMLButtonElement;
  leaderboardHardBtn: HTMLButtonElement;
  leaderboardList: HTMLDivElement;
  leaderboardBackBtn: HTMLButtonElement;
  result: HTMLDivElement;
  resultTitle: HTMLDivElement;
  resultSubtitle: HTMLDivElement;
  resultScore: HTMLSpanElement;
  resultBestScore: HTMLSpanElement;
  resultCongrats: HTMLDivElement;
  resultConfetti: HTMLDivElement;
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
  onlineLobby: HTMLDivElement;
  onlineLobbyMe: HTMLSpanElement;
  onlineLobbyOther: HTMLSpanElement;
  onlineLobbyError: HTMLDivElement;
  onlineReadyBtn: HTMLButtonElement;
  onlineStartBtn: HTMLButtonElement;
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
  roomInput.value = "";
  roomInput.inputMode = "numeric";
  roomInput.autocomplete = "off";
  roomInput.spellcheck = false;
  roomLabel.appendChild(roomInput);

  const onlineDifficultyLabel = doc.createElement("label");
  onlineDifficultyLabel.className = "menu-label";
  onlineDifficultyLabel.textContent = "在线难度";
  const onlineDifficultySelect = doc.createElement("select");
  onlineDifficultySelect.className = "menu-select";
  const odEasy = doc.createElement("option");
  odEasy.value = "easy";
  odEasy.textContent = "容易";
  const odNormal = doc.createElement("option");
  odNormal.value = "normal";
  odNormal.textContent = "正常";
  const odHard = doc.createElement("option");
  odHard.value = "hard";
  odHard.textContent = "困难";
  onlineDifficultySelect.append(odEasy, odNormal, odHard);
  onlineDifficultySelect.value = "normal";
  try {
    const saved = localStorage.getItem("game.onlineDifficulty");
    if (saved === "easy" || saved === "hard" || saved === "normal") onlineDifficultySelect.value = saved;
  } catch {}
  onlineDifficultyLabel.appendChild(onlineDifficultySelect);

  const createRoomBtn = doc.createElement("button");
  createRoomBtn.type = "button";
  createRoomBtn.className = "menu-btn";
  createRoomBtn.textContent = "创建房间";
  createRoomBtn.dataset.action = "menu.online.create";

  const joinRoomBtn = doc.createElement("button");
  joinRoomBtn.type = "button";
  joinRoomBtn.className = "menu-btn";
  joinRoomBtn.textContent = "加入房间";
  joinRoomBtn.dataset.action = "menu.online.join";

  const leaderboardBtn = doc.createElement("button");
  leaderboardBtn.type = "button";
  leaderboardBtn.className = "menu-btn";
  leaderboardBtn.textContent = "排行榜";
  leaderboardBtn.dataset.action = "nav.leaderboard";

  const difficultyRow = doc.createElement("div");
  difficultyRow.className = "menu-row";
  const difficultyLabel = doc.createElement("label");
  difficultyLabel.className = "menu-label";
  difficultyLabel.textContent = "难度";
  const difficultySelect = doc.createElement("select");
  difficultySelect.className = "menu-select";
  const dEasy = doc.createElement("option");
  dEasy.value = "easy";
  dEasy.textContent = "容易";
  const dNormal = doc.createElement("option");
  dNormal.value = "normal";
  dNormal.textContent = "正常";
  const dHard = doc.createElement("option");
  dHard.value = "hard";
  dHard.textContent = "困难";
  difficultySelect.append(dEasy, dNormal, dHard);
  difficultySelect.value = "normal";
  try {
    const saved = localStorage.getItem("game.difficulty");
    if (saved === "easy" || saved === "hard" || saved === "normal") difficultySelect.value = saved;
  } catch {}
  difficultyLabel.appendChild(difficultySelect);
  const difficultyHint = doc.createElement("div");
  difficultyHint.className = "menu-hint";
  difficultyHint.textContent = "仅影响单人模式";
  difficultyRow.append(difficultyLabel, difficultyHint);

  const soundRow = doc.createElement("div");
  soundRow.className = "menu-row";
  const soundLabel = doc.createElement("label");
  soundLabel.className = "menu-label";
  soundLabel.textContent = "砍树音效";
  const soundSelect = doc.createElement("select");
  soundSelect.className = "menu-select";
  const oMix = doc.createElement("option");
  oMix.value = "mix";
  oMix.textContent = "混合（推荐）";
  const oThud = doc.createElement("option");
  oThud.value = "thud";
  oThud.textContent = "咚！木头";
  const oSwish = doc.createElement("option");
  oSwish.value = "swish";
  oSwish.textContent = "唰！挥砍";
  const oClick = doc.createElement("option");
  oClick.value = "click";
  oClick.textContent = "啪嗒！清脆";
  const oTung = doc.createElement("option");
  oTung.value = "tungtung";
  oTung.textContent = "通通声（mp3）";
  soundSelect.append(oMix, oThud, oSwish, oClick, oTung);
  try {
    const saved = localStorage.getItem("audio.chopStyle");
    if (saved) soundSelect.value = saved;
  } catch {}
  soundLabel.appendChild(soundSelect);
  const soundTestBtn = doc.createElement("button");
  soundTestBtn.type = "button";
  soundTestBtn.className = "menu-btn menu-btn-sm";
  soundTestBtn.textContent = "试听";
  soundTestBtn.dataset.action = "menu.sound.test";
  soundRow.append(soundLabel, soundTestBtn);

  onlineForm.append(roomLabel, onlineDifficultyLabel);
  menu.append(title, singleBtn, onlineForm, createRoomBtn, joinRoomBtn, leaderboardBtn, difficultyRow, soundRow);

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

  const onlineLobby = doc.createElement("div");
  onlineLobby.className = "hud-online-lobby";
  const lobbyLine = doc.createElement("div");
  lobbyLine.className = "hud-online-lobby-line";
  lobbyLine.textContent = "你是 ";
  const onlineLobbyMe = doc.createElement("span");
  onlineLobbyMe.textContent = "--";
  lobbyLine.appendChild(onlineLobbyMe);
  const lobbyOther = doc.createElement("div");
  lobbyOther.className = "hud-online-lobby-other";
  lobbyOther.textContent = "对方：";
  const onlineLobbyOther = doc.createElement("span");
  onlineLobbyOther.textContent = "未加入";
  lobbyOther.appendChild(onlineLobbyOther);
  const onlineLobbyError = doc.createElement("div");
  onlineLobbyError.className = "hud-online-error";
  onlineLobbyError.style.display = "none";
  const lobbyActions = doc.createElement("div");
  lobbyActions.className = "hud-online-lobby-actions";
  const onlineReadyBtn = doc.createElement("button");
  onlineReadyBtn.type = "button";
  onlineReadyBtn.className = "menu-btn menu-btn-sm";
  onlineReadyBtn.textContent = "准备";
  onlineReadyBtn.dataset.action = "online.ready";
  const onlineStartBtn = doc.createElement("button");
  onlineStartBtn.type = "button";
  onlineStartBtn.className = "menu-btn menu-btn-sm";
  onlineStartBtn.textContent = "开始";
  onlineStartBtn.dataset.action = "online.start";
  lobbyActions.append(onlineReadyBtn, onlineStartBtn);
  onlineLobby.append(lobbyLine, lobbyOther, onlineLobbyError, lobbyActions);

  onlineHud.append(roomLine, p1, p1Bar, p2, p2Bar, onlineLobby);

  hud.append(singleHud, onlineHud);

  const result = doc.createElement("div");
  result.className = "overlay overlay-result";
  const resultCard = doc.createElement("div");
  resultCard.className = "result-card";
  const resultTitle = doc.createElement("div");
  resultTitle.className = "result-title";
  resultTitle.textContent = "失败";

  const resultSubtitle = doc.createElement("div");
  resultSubtitle.className = "result-subtitle";
  resultSubtitle.style.display = "none";

  const resultCongrats = doc.createElement("div");
  resultCongrats.className = "result-congrats";
  resultCongrats.textContent = "恭喜！打破记录！";
  resultCongrats.style.display = "none";

  const resultLine = doc.createElement("div");
  resultLine.className = "result-line";
  resultLine.textContent = "本次分数 ";
  const resultScore = doc.createElement("span");
  resultScore.textContent = "0";
  resultLine.appendChild(resultScore);

  const bestLine = doc.createElement("div");
  bestLine.className = "result-line";
  bestLine.textContent = "最好成绩 ";
  const resultBestScore = doc.createElement("span");
  resultBestScore.textContent = "0";
  bestLine.appendChild(resultBestScore);

  const confetti = doc.createElement("div");
  confetti.className = "result-confetti";

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
  resultCard.append(resultTitle, resultSubtitle, resultCongrats, resultLine, bestLine, resultActions);
  result.append(confetti, resultCard);

  const leaderboard = doc.createElement("div");
  leaderboard.className = "overlay overlay-leaderboard";
  const boardCard = doc.createElement("div");
  boardCard.className = "result-card";
  const boardTitle = doc.createElement("div");
  boardTitle.className = "result-title";
  boardTitle.textContent = "排行榜";
  const boardTabs = doc.createElement("div");
  boardTabs.className = "leaderboard-tabs";
  const easyBtn = doc.createElement("button");
  easyBtn.type = "button";
  easyBtn.className = "leaderboard-tab";
  easyBtn.textContent = "容易";
  easyBtn.dataset.action = "leaderboard.easy";
  const normalBtn = doc.createElement("button");
  normalBtn.type = "button";
  normalBtn.className = "leaderboard-tab";
  normalBtn.textContent = "正常";
  normalBtn.dataset.action = "leaderboard.normal";
  const hardBtn = doc.createElement("button");
  hardBtn.type = "button";
  hardBtn.className = "leaderboard-tab";
  hardBtn.textContent = "困难";
  hardBtn.dataset.action = "leaderboard.hard";
  boardTabs.append(easyBtn, normalBtn, hardBtn);
  const boardList = doc.createElement("div");
  boardList.className = "leaderboard-list";
  const boardBack = doc.createElement("button");
  boardBack.type = "button";
  boardBack.className = "menu-btn";
  boardBack.textContent = "返回";
  boardBack.dataset.action = "nav.menu";
  boardCard.append(boardTitle, boardTabs, boardList, boardBack);
  leaderboard.appendChild(boardCard);

  root.append(canvas, menu, hud, leaderboard, result);

  const overlays: Overlays = {
    root,
    canvas,
    menu,
    menuSingleBtn: singleBtn,
    menuCreateRoomBtn: createRoomBtn,
    menuJoinRoomBtn: joinRoomBtn,
    menuLeaderboardBtn: leaderboardBtn,
    menuRoomInput: roomInput,
    menuOnlineDifficultySelect: onlineDifficultySelect,
    menuDifficultySelect: difficultySelect,
    menuChopSoundSelect: soundSelect,
    menuChopSoundTestBtn: soundTestBtn,
    hud,
    leaderboard,
    leaderboardEasyBtn: easyBtn,
    leaderboardNormalBtn: normalBtn,
    leaderboardHardBtn: hardBtn,
    leaderboardList: boardList,
    leaderboardBackBtn: boardBack,
    result,
    resultTitle,
    resultSubtitle,
    resultScore,
    resultBestScore,
    resultCongrats,
    resultConfetti: confetti,
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
    onlineP2TimeFill,
    onlineLobby,
    onlineLobbyMe,
    onlineLobbyOther,
    onlineLobbyError,
    onlineReadyBtn,
    onlineStartBtn
  };
  showMenu(overlays);
  return overlays;
}

export function showMenu(overlays: Overlays): void {
  overlays.menu.style.display = "flex";
  overlays.hud.style.display = "none";
  overlays.leaderboard.style.display = "none";
  overlays.result.style.display = "none";
}

export function showHudSingle(overlays: Overlays, params: { score: number; timeRatio01: number }): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "flex";
  overlays.leaderboard.style.display = "none";
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
    lobby?: {
      meLabel: string;
      otherLabel: string;
      error?: string | null;
      readyEnabled: boolean;
      readyText: string;
      startEnabled: boolean;
      startText: string;
    };
  }
): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "flex";
  overlays.leaderboard.style.display = "none";
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

  if (params.lobby) {
    overlays.onlineLobby.style.display = "flex";
    overlays.onlineLobbyMe.textContent = params.lobby.meLabel;
    overlays.onlineLobbyOther.textContent = params.lobby.otherLabel;
    const err = params.lobby.error ?? null;
    overlays.onlineLobbyError.textContent = err ?? "";
    overlays.onlineLobbyError.style.display = err ? "block" : "none";
    overlays.onlineReadyBtn.disabled = !params.lobby.readyEnabled;
    overlays.onlineReadyBtn.textContent = params.lobby.readyText;
    overlays.onlineStartBtn.disabled = !params.lobby.startEnabled;
    overlays.onlineStartBtn.textContent = params.lobby.startText;
  } else {
    overlays.onlineLobby.style.display = "none";
    overlays.onlineLobbyError.style.display = "none";
  }
}

export function showLeaderboard(
  overlays: Overlays,
  params: { difficulty: "easy" | "normal" | "hard"; entries: Array<{ score: number; atMs: number }> }
): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "none";
  overlays.result.style.display = "none";
  overlays.leaderboard.style.display = "flex";

  overlays.leaderboardList.replaceChildren();
  overlays.leaderboardEasyBtn.classList.remove("is-active");
  overlays.leaderboardNormalBtn.classList.remove("is-active");
  overlays.leaderboardHardBtn.classList.remove("is-active");
  if (params.difficulty === "easy") overlays.leaderboardEasyBtn.classList.add("is-active");
  if (params.difficulty === "normal") overlays.leaderboardNormalBtn.classList.add("is-active");
  if (params.difficulty === "hard") overlays.leaderboardHardBtn.classList.add("is-active");
  const entries = params.entries;
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = "暂无记录";
    overlays.leaderboardList.appendChild(empty);
    return;
  }

  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    const left = document.createElement("div");
    left.className = "leaderboard-rank";
    left.textContent = String(i + 1);
    const mid = document.createElement("div");
    mid.className = "leaderboard-score";
    mid.textContent = String(e.score);
    const right = document.createElement("div");
    right.className = "leaderboard-time";
    right.textContent = formatShortTime(e.atMs);
    row.append(left, mid, right);
    overlays.leaderboardList.appendChild(row);
  }
}

export function showResult(
  overlays: Overlays,
  params: { score: number; bestScore?: number; isNewRecord?: boolean; title?: string; subtitle?: string }
): void {
  overlays.menu.style.display = "none";
  overlays.hud.style.display = "none";
  overlays.leaderboard.style.display = "none";
  overlays.result.style.display = "flex";
  overlays.resultTitle.textContent = params.title ?? "失败";
  const subtitle = params.subtitle?.trim();
  overlays.resultSubtitle.textContent = subtitle ?? "";
  overlays.resultSubtitle.style.display = subtitle ? "block" : "none";
  overlays.resultScore.textContent = String(params.score);

  if (params.bestScore !== undefined) {
    overlays.resultBestScore.textContent = String(params.bestScore);
    (overlays.resultBestScore.parentElement as HTMLElement).style.display = "block";
  } else {
    (overlays.resultBestScore.parentElement as HTMLElement).style.display = "none";
  }

  const isNew = params.isNewRecord === true;
  overlays.resultCongrats.style.display = isNew ? "block" : "none";
  if (isNew) maybeConfetti(overlays, String(params.score));
}

function maybeConfetti(overlays: Overlays, key: string): void {
  if ((overlays.resultConfetti as any).dataset?.for === key) return;
  (overlays.resultConfetti as any).dataset.for = key;
  overlays.resultConfetti.replaceChildren();
  const colors = ["#f2d16b", "#e58a7a", "#77b8e5", "#86d07c", "#c79be5", "#f0f0f0"];
  const n = 26;
  for (let i = 0; i < n; i += 1) {
    const d = document.createElement("div");
    d.className = "confetti";
    const left = Math.floor((i / n) * 100 + Math.random() * (100 / n));
    const delay = Math.random() * 0.25;
    const dur = 0.9 + Math.random() * 0.6;
    const rot = Math.floor(Math.random() * 360);
    d.setAttribute(
      "style",
      `left:${left}%;background:${colors[i % colors.length]};animation-delay:${delay}s;animation-duration:${dur}s;transform:rotate(${rot}deg)`
    );
    overlays.resultConfetti.appendChild(d);
  }
  setTimeout(() => {
    overlays.resultConfetti.replaceChildren();
  }, 1600);
}

function formatShortTime(atMs: number): string {
  const d = new Date(atMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
