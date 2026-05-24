export type Overlays = {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  menu: HTMLDivElement;
  menuTitleRow: HTMLDivElement;
  menuMainPanel: HTMLDivElement;
  menuCreatePanel: HTMLDivElement;
  menuJoinPanel: HTMLDivElement;
  muteBtn: HTMLButtonElement;
  menuSingleBtn: HTMLButtonElement;
  menuCreateRoomBtn: HTMLButtonElement;
  menuJoinRoomBtn: HTMLButtonElement;
  menuLeaderboardBtn: HTMLButtonElement;
  menuCreateRoomInput: HTMLInputElement;
  menuCreateDifficultySelect: HTMLSelectElement;
  menuCreateError: HTMLDivElement;
  menuCreateConfirmBtn: HTMLButtonElement;
  menuCreateBackBtn: HTMLButtonElement;
  menuJoinRoomInput: HTMLInputElement;
  menuJoinSuggestions: HTMLDivElement;
  menuJoinError: HTMLDivElement;
  menuJoinConfirmBtn: HTMLButtonElement;
  menuJoinBackBtn: HTMLButtonElement;
  menuDifficultySelect: HTMLSelectElement;
  menuChopSoundSelect: HTMLSelectElement;
  menuChopSoundTestBtn: HTMLButtonElement;
  menuBgmVolumeRange: HTMLInputElement;
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

  const muteBtn = doc.createElement("button");
  muteBtn.type = "button";
  muteBtn.className = "mute-btn";
  muteBtn.dataset.action = "audio.mute";
  muteBtn.setAttribute("aria-label", "静音");
  muteBtn.setAttribute("aria-pressed", "false");
  muteBtn.innerHTML =
    '<span class="mute-icon mute-icon-on" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M11 5.5 7.7 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.7L11 18.5a1 1 0 0 0 1.6-.8V6.3a1 1 0 0 0-1.6-.8ZM14.6 8.5a1 1 0 0 1 1.4 0 4 4 0 0 1 0 5.7 1 1 0 1 1-1.4-1.4 2 2 0 0 0 0-2.8 1 1 0 0 1 0-1.5ZM17.4 6.3a1 1 0 0 1 1.4 0 7 7 0 0 1 0 11.4 1 1 0 1 1-1.4-1.4 5 5 0 0 0 0-8.6 1 1 0 0 1 0-1.4Z"/></svg></span>' +
    '<span class="mute-icon mute-icon-off" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M11 5.5 7.7 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.7L11 18.5a1 1 0 0 0 1.6-.8V6.3a1 1 0 0 0-1.6-.8ZM16.3 9.3a1 1 0 0 1 1.4 0L19 10.6l1.3-1.3a1 1 0 1 1 1.4 1.4L20.4 12l1.3 1.3a1 1 0 0 1-1.4 1.4L19 13.4l-1.3 1.3a1 1 0 0 1-1.4-1.4l1.3-1.3-1.3-1.3a1 1 0 0 1 0-1.4Z"/></svg></span>';

  const menu = doc.createElement("div");
  menu.className = "overlay overlay-menu";

  const titleRow = doc.createElement("div");
  titleRow.className = "menu-title-row";
  const vuLeft = doc.createElement("div");
  vuLeft.className = "menu-vu";
  const vuRight = doc.createElement("div");
  vuRight.className = "menu-vu";
  for (let i = 0; i < 5; i += 1) {
    const b1 = doc.createElement("span");
    b1.className = "menu-vu-bar";
    b1.setAttribute("style", `animation-delay:${i * 0.08}s`);
    vuLeft.appendChild(b1);
    const b2 = doc.createElement("span");
    b2.className = "menu-vu-bar";
    b2.setAttribute("style", `animation-delay:${(0.12 + i * 0.08).toFixed(2)}s`);
    vuRight.appendChild(b2);
  }

  const title = doc.createElement("div");
  title.className = "menu-title";
  title.textContent = "归海一刀";
  titleRow.append(vuLeft, title, vuRight);

  const singleBtn = doc.createElement("button");
  singleBtn.type = "button";
  singleBtn.className = "menu-btn";
  singleBtn.textContent = "单人";
  singleBtn.dataset.action = "menu.single";

  const createRoomBtn = doc.createElement("button");
  createRoomBtn.type = "button";
  createRoomBtn.className = "menu-btn";
  createRoomBtn.textContent = "创建房间";
  createRoomBtn.dataset.action = "menu.create";

  const joinRoomBtn = doc.createElement("button");
  joinRoomBtn.type = "button";
  joinRoomBtn.className = "menu-btn";
  joinRoomBtn.textContent = "加入房间";
  joinRoomBtn.dataset.action = "menu.join";

  const leaderboardBtn = doc.createElement("button");
  leaderboardBtn.type = "button";
  leaderboardBtn.className = "menu-btn";
  leaderboardBtn.textContent = "排行榜";
  leaderboardBtn.dataset.action = "nav.leaderboard";

  const menuMainPanel = doc.createElement("div");
  menuMainPanel.className = "menu-panel";

  const createJoinRow = doc.createElement("div");
  createJoinRow.className = "menu-row menu-row-two";
  createJoinRow.append(createRoomBtn, joinRoomBtn);

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

  const bgmRow = doc.createElement("div");
  bgmRow.className = "menu-row";
  const bgmLabel = doc.createElement("label");
  bgmLabel.className = "menu-label";
  bgmLabel.textContent = "背景音乐音量";
  const bgmRange = doc.createElement("input");
  bgmRange.type = "range";
  bgmRange.min = "0";
  bgmRange.max = "100";
  bgmRange.step = "1";
  bgmRange.className = "menu-range";
  let bgmVolume01 = 0.5;
  try {
    const raw = localStorage.getItem("audio.bgmVolume");
    const v = raw ? Number(raw) : NaN;
    if (Number.isFinite(v)) bgmVolume01 = Math.max(0, Math.min(1, v));
  } catch {}
  bgmRange.value = String(Math.round(bgmVolume01 * 100));
  bgmLabel.appendChild(bgmRange);
  bgmRow.appendChild(bgmLabel);

  menuMainPanel.append(singleBtn, leaderboardBtn, difficultyRow, soundRow, createJoinRow, bgmRow);

  const menuCreatePanel = doc.createElement("div");
  menuCreatePanel.className = "menu-panel";
  menuCreatePanel.style.display = "none";
  const createTitle = doc.createElement("div");
  createTitle.className = "menu-subtitle";
  createTitle.textContent = "创建房间";

  const createRoomLabel = doc.createElement("label");
  createRoomLabel.className = "menu-label";
  createRoomLabel.textContent = "房间号";
  const createRoomInput = doc.createElement("input");
  createRoomInput.className = "menu-input";
  createRoomInput.value = "";
  createRoomInput.inputMode = "numeric";
  createRoomInput.autocomplete = "off";
  createRoomInput.spellcheck = false;
  createRoomLabel.appendChild(createRoomInput);

  const createDifficultyLabel = doc.createElement("label");
  createDifficultyLabel.className = "menu-label";
  createDifficultyLabel.textContent = "在线难度";
  const createDifficultySelect = doc.createElement("select");
  createDifficultySelect.className = "menu-select";
  const odEasy = doc.createElement("option");
  odEasy.value = "easy";
  odEasy.textContent = "容易";
  const odNormal = doc.createElement("option");
  odNormal.value = "normal";
  odNormal.textContent = "正常";
  const odHard = doc.createElement("option");
  odHard.value = "hard";
  odHard.textContent = "困难";
  createDifficultySelect.append(odEasy, odNormal, odHard);
  createDifficultySelect.value = "normal";
  try {
    const saved = localStorage.getItem("game.onlineDifficulty");
    if (saved === "easy" || saved === "hard" || saved === "normal") createDifficultySelect.value = saved;
  } catch {}
  createDifficultyLabel.appendChild(createDifficultySelect);

  const createForm = doc.createElement("div");
  createForm.className = "menu-online-form";
  createForm.append(createRoomLabel, createDifficultyLabel);

  const createError = doc.createElement("div");
  createError.className = "menu-error";
  createError.style.display = "none";

  const createBtns = doc.createElement("div");
  createBtns.className = "menu-row menu-row-two";
  const createConfirmBtn = doc.createElement("button");
  createConfirmBtn.type = "button";
  createConfirmBtn.className = "menu-btn";
  createConfirmBtn.textContent = "确认创建";
  createConfirmBtn.dataset.action = "menu.create.confirm";
  const createBackBtn = doc.createElement("button");
  createBackBtn.type = "button";
  createBackBtn.className = "menu-btn";
  createBackBtn.textContent = "返回";
  createBackBtn.dataset.action = "nav.menu";
  createBtns.append(createConfirmBtn, createBackBtn);

  menuCreatePanel.append(createTitle, createForm, createError, createBtns);

  const menuJoinPanel = doc.createElement("div");
  menuJoinPanel.className = "menu-panel";
  menuJoinPanel.style.display = "none";
  const joinTitle = doc.createElement("div");
  joinTitle.className = "menu-subtitle";
  joinTitle.textContent = "加入房间";

  const joinRoomLabel = doc.createElement("label");
  joinRoomLabel.className = "menu-label";
  joinRoomLabel.textContent = "房间号";
  const joinRoomInput = doc.createElement("input");
  joinRoomInput.className = "menu-input";
  joinRoomInput.value = "";
  joinRoomInput.inputMode = "numeric";
  joinRoomInput.autocomplete = "off";
  joinRoomInput.spellcheck = false;
  joinRoomLabel.appendChild(joinRoomInput);

  const joinForm = doc.createElement("div");
  joinForm.className = "menu-online-form";
  joinForm.append(joinRoomLabel);

  const joinSuggestions = doc.createElement("div");
  joinSuggestions.className = "menu-suggestions";

  const joinError = doc.createElement("div");
  joinError.className = "menu-error";
  joinError.style.display = "none";

  const joinBtns = doc.createElement("div");
  joinBtns.className = "menu-row menu-row-two";
  const joinConfirmBtn = doc.createElement("button");
  joinConfirmBtn.type = "button";
  joinConfirmBtn.className = "menu-btn";
  joinConfirmBtn.textContent = "进入房间";
  joinConfirmBtn.dataset.action = "menu.join.confirm";
  const joinBackBtn = doc.createElement("button");
  joinBackBtn.type = "button";
  joinBackBtn.className = "menu-btn";
  joinBackBtn.textContent = "返回";
  joinBackBtn.dataset.action = "nav.menu";
  joinBtns.append(joinConfirmBtn, joinBackBtn);

  menuJoinPanel.append(joinTitle, joinForm, joinSuggestions, joinError, joinBtns);

  menu.append(titleRow, menuMainPanel, menuCreatePanel, menuJoinPanel);

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
  p1.textContent = "对方 ";
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
  p2.textContent = "我 ";
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

  root.append(canvas, menu, hud, leaderboard, result, muteBtn);

  const overlays: Overlays = {
    root,
    canvas,
    menu,
    menuTitleRow: titleRow,
    menuMainPanel,
    menuCreatePanel,
    menuJoinPanel,
    muteBtn,
    menuSingleBtn: singleBtn,
    menuCreateRoomBtn: createRoomBtn,
    menuJoinRoomBtn: joinRoomBtn,
    menuLeaderboardBtn: leaderboardBtn,
    menuCreateRoomInput: createRoomInput,
    menuCreateDifficultySelect: createDifficultySelect,
    menuCreateError: createError,
    menuCreateConfirmBtn: createConfirmBtn,
    menuCreateBackBtn: createBackBtn,
    menuJoinRoomInput: joinRoomInput,
    menuJoinSuggestions: joinSuggestions,
    menuJoinError: joinError,
    menuJoinConfirmBtn: joinConfirmBtn,
    menuJoinBackBtn: joinBackBtn,
    menuDifficultySelect: difficultySelect,
    menuChopSoundSelect: soundSelect,
    menuChopSoundTestBtn: soundTestBtn,
    menuBgmVolumeRange: bgmRange,
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

type MenuPage = "main" | "create" | "join";

export function showMenu(
  overlays: Overlays,
  params?: {
    page?: MenuPage;
    create?: { error?: string | null };
    join?: { suggestions?: string[]; error?: string | null };
  }
): void {
  overlays.menu.style.display = "flex";
  overlays.hud.style.display = "none";
  overlays.leaderboard.style.display = "none";
  overlays.result.style.display = "none";

  const page: MenuPage = params?.page ?? "main";
  overlays.menuMainPanel.style.display = page === "main" ? "flex" : "none";
  overlays.menuCreatePanel.style.display = page === "create" ? "flex" : "none";
  overlays.menuJoinPanel.style.display = page === "join" ? "flex" : "none";

  const createErr = params?.create?.error ?? null;
  overlays.menuCreateError.textContent = createErr ?? "";
  overlays.menuCreateError.style.display = createErr ? "block" : "none";

  const joinErr = params?.join?.error ?? null;
  overlays.menuJoinError.textContent = joinErr ?? "";
  overlays.menuJoinError.style.display = joinErr ? "block" : "none";

  overlays.menuJoinSuggestions.replaceChildren();
  if (page === "join") {
    const suggestions = params?.join?.suggestions ?? [];
    for (const roomId of suggestions) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "menu-suggestion";
      (btn as any).dataset.roomid = roomId;
      btn.textContent = roomId;
      overlays.menuJoinSuggestions.appendChild(btn);
    }
  }
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
    left: { score: number; timeRatio01: number; status: "alive" | "dead" };
    right: { score: number; timeRatio01: number; status: "alive" | "dead" };
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
  overlays.onlineP1Score.textContent = String(params.left.score);
  overlays.onlineP2Score.textContent = String(params.right.score);

  const p1Pct = Math.round(Math.max(0, Math.min(1, params.left.timeRatio01)) * 100);
  const p2Pct = Math.round(Math.max(0, Math.min(1, params.right.timeRatio01)) * 100);
  overlays.onlineP1TimeFill.setAttribute("style", `width: ${p1Pct}%`);
  overlays.onlineP2TimeFill.setAttribute("style", `width: ${p2Pct}%`);

  overlays.onlineHud.style.opacity = params.left.status === "dead" && params.right.status === "dead" ? "0.8" : "1";

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
