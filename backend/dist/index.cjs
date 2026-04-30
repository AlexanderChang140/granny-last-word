"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_dotenv3 = __toESM(require("dotenv"), 1);
var import_express4 = __toESM(require("express"), 1);
var import_http = require("http");
var import_socket = require("socket.io");

// src/modules/auth/routes.ts
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_express = __toESM(require("express"), 1);

// src/modules/auth/controller.ts
var import_dotenv2 = __toESM(require("dotenv"), 1);

// src/modules/auth/service.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_argon2 = __toESM(require("argon2"), 1);

// src/modules/db/db.ts
var import_pg = require("pg");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var pool = new import_pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
var db_default = pool;

// src/modules/auth/service.ts
async function signup(username, password) {
  const hash = await import_argon2.default.hash(password, {
    type: import_argon2.default.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
    hashLength: 16
  });
  const existing = await db_default.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );
  if (existing.rows.length > 0) return null;
  await db_default.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
    username,
    hash
  ]);
  return createToken(username);
}
async function login(username, password) {
  const result = await db_default.query(
    "SELECT password FROM users WHERE username = $1",
    [username]
  );
  const hash = result.rows[0]?.password;
  if (hash && await import_argon2.default.verify(hash, password)) {
    return createToken(username);
  }
  return null;
}
async function logout(token) {
  await db_default.query("DELETE FROM sessions WHERE id = $1", [token]);
}
async function validateSession(token) {
  const result = await db_default.query(
    `SELECT u.id, u.username FROM sessions s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.id = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return result.rows[0];
}
async function createToken(username) {
  const token = import_crypto.default.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1e3 * 60 * 60);
  const user = await db_default.query("SELECT id FROM users WHERE username = $1", [
    username
  ]);
  await db_default.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, user.rows[0].id, expiresAt]
  );
  return token;
}

// src/modules/auth/controller.ts
import_dotenv2.default.config();
async function postSignup(req, res) {
  const { username, password } = parseUser(req);
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }
  const token = await signup(username, password);
  if (token) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1e3 * 60 * 60
    });
    return res.status(201).json({ username, message: "Signup successful" });
  } else {
    return res.status(409).json({ error: "User already exists" });
  }
}
async function postLogin(req, res) {
  const { username, password } = parseUser(req);
  if (!username || !password) {
    return res.status(400).json({ username, error: "Missing username or password" });
  }
  const token = await login(username, password);
  if (token) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1e3 * 60 * 60
    });
    return res.status(200).json({ username, message: "Login successful" });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
}
async function postLogout(req, res) {
  await logout(req.cookies.token);
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out" });
}
async function getValidate(req, res) {
  const userData = await validateSession(req.cookies.token);
  if (userData !== void 0) {
    return res.status(200).json({ username: userData, message: "Valid session" });
  } else {
    res.clearCookie("token");
    return res.status(401).json({ error: "Invalid session" });
  }
}
function parseUser(req) {
  const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
  const username = req.body.username?.toString();
  const password = req.body.password?.toString();
  return usernamePattern.test(username) ? { username, password } : {};
}

// src/modules/auth/routes.ts
var router = import_express.default.Router();
router.use(import_express.default.json());
router.use((0, import_cookie_parser.default)());
router.post("/signup", (req, res) => {
  postSignup(req, res);
});
router.post("/login", (req, res) => {
  postLogin(req, res);
});
router.post("/logout", (req, res) => {
  postLogout(req, res);
});
router.get("/validate", (req, res) => {
  getValidate(req, res);
});
var routes_default = router;

// src/modules/game/cache.ts
var import_async_mutex = require("async-mutex");
var cache = /* @__PURE__ */ new Map();
var locks = /* @__PURE__ */ new Map();
function getLock(sessionId) {
  const lock = locks.get(sessionId) ?? new import_async_mutex.Mutex();
  locks.set(sessionId, lock);
  return lock;
}
async function get(sessionId) {
  return cache.get(sessionId);
}
async function set(sessionId, data) {
  const mutex = getLock(sessionId);
  await mutex.runExclusive(() => {
    cache.set(sessionId, data);
  });
}
async function update(sessionId, updater) {
  const mutex = getLock(sessionId);
  return await mutex.runExclusive(() => {
    const current = cache.get(sessionId);
    if (!current) throw new Error("Session not found");
    const newData = updater(current);
    cache.set(sessionId, newData);
    return newData;
  });
}

// src/modules/game/deck.ts
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function checkLetters(word, hand) {
  const handIds = new Set(hand.map((l) => l.id));
  const wordIds = new Set(word);
  return wordIds.size === word.length && handIds.intersection(wordIds).size === wordIds.size;
}
function useLetters(word, hand, discard) {
  const ids = new Set(word);
  const newHand = hand.filter((letter) => !ids.has(letter.id));
  const newDiscard = [
    ...discard,
    ...hand.filter((letter) => ids.has(letter.id))
  ];
  return { hand: newHand, discard: newDiscard };
}
function drawLetters(hand, draw, discard, handSize) {
  const newHand = [...hand];
  let newDraw = [...draw];
  let newDiscard = [...discard];
  while (newHand.length < handSize) {
    if (newDraw.length === 0) {
      const nextOffset = getNextLetterId(newHand, newDraw, newDiscard);
      newDraw = createWeightedDrawPile(nextOffset);
    }
    const drawnLetter = newDraw.pop();
    if (drawnLetter) {
      newHand.push(drawnLetter);
    }
  }
  return { hand: newHand, draw: newDraw, discard: newDiscard };
}
function parseWord(word, hand) {
  const mapping = /* @__PURE__ */ new Map();
  hand.forEach((letter) => mapping.set(letter.id, letter));
  return word.map((id) => mapping.get(id));
}
function arrToLetters(arr, offset = 0) {
  let letters = [];
  for (let i = 0; i < arr.length; i++) {
    const char = arr[i];
    if (isSingleLetter(char)) {
      letters.push({ id: i + offset, letter: char });
    }
  }
  return letters;
}
function createWeightedDrawPile(offset = 0) {
  const weightedLetters = [
    ...repeatLetter("e", 13),
    ...repeatLetter("a", 12),
    ...repeatLetter("i", 8),
    ...repeatLetter("r", 8),
    ...repeatLetter("s", 8),
    ...repeatLetter("n", 6),
    ...repeatLetter("o", 5),
    ...repeatLetter("t", 5),
    ...repeatLetter("l", 4),
    ...repeatLetter("u", 4),
    ...repeatLetter("d", 3),
    ...repeatLetter("g", 2),
    ...repeatLetter("b", 2),
    ...repeatLetter("c", 3),
    ...repeatLetter("m", 2),
    ...repeatLetter("p", 2),
    ...repeatLetter("f", 2),
    ...repeatLetter("h", 2),
    ...repeatLetter("v", 2),
    ...repeatLetter("w", 2),
    ...repeatLetter("y", 2),
    ...repeatLetter("k", 1),
    ...repeatLetter("j", 1),
    ...repeatLetter("x", 1),
    ...repeatLetter("q", 1),
    ...repeatLetter("z", 1)
  ];
  return arrToLetters(shuffle(weightedLetters), offset);
}
function toWord(letters) {
  let word = [];
  for (const letter of letters) {
    word.push(letter.letter);
  }
  return word.join("");
}
function isSingleLetter(char) {
  return /^[a-zA-Z]$/.test(char);
}
function repeatLetter(letter, count) {
  return Array.from({ length: count }, () => letter);
}
function getNextLetterId(...groups) {
  let maxId = -1;
  for (const group of groups) {
    for (const letter of group) {
      maxId = Math.max(maxId, letter.id);
    }
  }
  return maxId + 1;
}

// src/modules/game/word/validation.ts
var import_node_fs = require("fs");
var import_node_path = __toESM(require("path"), 1);
var WORD_SET = generateWordSet();
var SCORE_MAP = {
  A: 1,
  E: 1,
  I: 1,
  O: 1,
  U: 1,
  L: 1,
  N: 1,
  S: 1,
  T: 1,
  R: 1,
  D: 2,
  G: 2,
  B: 3,
  C: 3,
  M: 3,
  P: 3,
  F: 4,
  H: 4,
  V: 4,
  W: 4,
  Y: 4,
  K: 5,
  J: 8,
  X: 8,
  Q: 10,
  Z: 10
};
function scoreWord(letters) {
  const word = toWord(letters);
  if (!WORD_SET.has(word.toUpperCase())) {
    return 0;
  }
  let score = 0;
  for (const c of word) {
    score += SCORE_MAP[c.toUpperCase()] ?? 0;
  }
  return score;
}
function generateWordSet() {
  const candidates = [
    import_node_path.default.resolve(process.cwd(), "dictionary.txt"),
    import_node_path.default.resolve(process.cwd(), "backend/dictionary.txt")
  ];
  const filePath = candidates.find((candidate) => (0, import_node_fs.existsSync)(candidate));
  try {
    if (!filePath) {
      throw new Error("dictionary.txt not found");
    }
    const data = (0, import_node_fs.readFileSync)(filePath, "utf-8");
    const words = data.split(/\r?\n/).map((word) => word.trim().toUpperCase()).filter((word) => word.length > 0);
    return new Set(words);
  } catch (error) {
    console.error("Could not read dictionary file:", error);
    return /* @__PURE__ */ new Set();
  }
}

// src/modules/game/engine.ts
var LEVEL_MAP = {
  1: 100,
  2: 125,
  3: 150,
  4: 175,
  5: 200
};
var GameEngine = class {
  static setupNewBattle(level = 1) {
    const handSize = DEFAULT_HAND_SIZE;
    const enemyMaxHp = LEVEL_MAP[level] || 200;
    let draw = createWeightedDrawPile();
    let hand = [];
    for (let i = 0; i < handSize; i++) {
      const letter = draw.pop();
      if (letter === void 0) {
        break;
      }
      hand.push(letter);
    }
    return {
      player_hp: 100,
      player_max_hp: 100,
      enemy_hp: enemyMaxHp,
      // 200 fallback for levels above 5
      enemy_max_hp: enemyMaxHp,
      level,
      turn_number: 1,
      turn_owner: "player",
      status: "running",
      run_score: 0,
      draw,
      discard: [],
      hand
    };
  }
  static submitWord(state, word) {
    let nextState = { ...state };
    console.log("Engine received action type: submit_word");
    if (state.turn_owner !== "player") {
      console.log("Cannot submit word: Not player turn");
      return {
        ...state,
        feedback: "Wait for your turn"
      };
    }
    if (!checkLetters(word, nextState.hand)) {
      console.log("Letters do not exist in hand");
      return {
        ...state,
        feedback: "Invalid word\nTry again"
      };
    }
    const letters = parseWord(word, nextState.hand);
    const score = scoreWord(letters);
    console.log(`Score: ${score}`);
    if (score === 0) {
      console.log("Invalid word");
      return {
        ...state,
        feedback: "Invalid word\nTry again"
      };
    }
    nextState = {
      ...nextState,
      ...useLetters(word, nextState.hand, nextState.discard)
    };
    nextState = {
      ...withoutFeedback(nextState),
      ...drawLetters(
        nextState.hand,
        nextState.draw,
        nextState.discard,
        getHandSize(nextState)
      ),
      run_score: nextState.run_score + score
    };
    nextState.enemy_hp -= score * 3;
    nextState = this.checkBattleWinState(nextState);
    return nextState;
  }
  static end_turn(state) {
    let nextState = { ...state };
    console.log("Engine received action type: end_turn");
    if (state.turn_owner !== "player") {
      console.log("Cannot end turn: Not player turn");
    }
    nextState = {
      ...withoutFeedback(nextState),
      ...drawLetters(
        nextState.hand,
        nextState.draw,
        nextState.discard,
        getHandSize(nextState)
      ),
      turn_owner: "enemy"
    };
    const damagePerLevel = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18 };
    const currentLevel = nextState.level;
    console.log(`Current Level: ${currentLevel}`);
    console.log(`Current Damage: ${damagePerLevel[currentLevel]}`);
    nextState.player_hp -= damagePerLevel[currentLevel];
    nextState.turn_owner = "player";
    nextState.turn_number += 1;
    nextState = this.checkBattleWinState(nextState);
    return nextState;
  }
  static checkBattleWinState(state) {
    let nextState = { ...state };
    if (nextState.player_hp <= 0) {
      nextState.status = "finished";
      nextState.result = "GAME_LOST";
    } else if (nextState.enemy_hp <= 0) {
      nextState.status = "finished";
      if (nextState.level >= 5) {
        nextState.result = "GAME_WON";
      } else {
        nextState.result = "ROUND_WON";
      }
    }
    return nextState;
  }
  static continueToNextStage(state) {
    if (state.status !== "finished" || state.result !== "ROUND_WON") {
      return state;
    }
    const nextLevel = Math.min(state.level + 1, 5);
    const nextBattle = this.setupNewBattle(nextLevel);
    return {
      ...nextBattle,
      player_hp: nextBattle.player_max_hp,
      player_max_hp: state.player_max_hp,
      run_score: state.run_score
    };
  }
};
var DEFAULT_HAND_SIZE = 10;
function getHandSize(gameState) {
  return DEFAULT_HAND_SIZE;
}
function withoutFeedback(state) {
  const { feedback: _feedback, ...rest } = state;
  return rest;
}

// src/modules/game/stats.ts
var ensureStatsTablePromise = null;
async function ensureStatsTable() {
  if (!ensureStatsTablePromise) {
    ensureStatsTablePromise = db_default.query(`
                CREATE TABLE IF NOT EXISTS player_stats (
                    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    total_runs INT NOT NULL DEFAULT 0,
                    best_score INT NOT NULL DEFAULT 0,
                    enemies_defeated INT NOT NULL DEFAULT 0,
                    longest_word TEXT NOT NULL DEFAULT '-',
                    last_run_result TEXT NOT NULL DEFAULT 'No runs yet'
                );
            `).then(() => void 0);
  }
  await ensureStatsTablePromise;
}
async function ensureRow(userId) {
  await ensureStatsTable();
  await db_default.query(
    `
            INSERT INTO player_stats (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
        `,
    [userId]
  );
}
async function getPlayerStats(userId) {
  await ensureRow(userId);
  const result = await db_default.query(
    `
            SELECT total_runs, best_score, enemies_defeated, longest_word, last_run_result
            FROM player_stats
            WHERE user_id = $1
        `,
    [userId]
  );
  const row = result.rows[0];
  return {
    totalRuns: row?.total_runs ?? 0,
    bestScore: row?.best_score ?? 0,
    enemiesDefeated: row?.enemies_defeated ?? 0,
    longestWord: row?.longest_word ?? "-",
    lastRunResult: row?.last_run_result ?? "No runs yet"
  };
}
async function recordRunStarted(userId) {
  await ensureRow(userId);
  await db_default.query(
    `
            UPDATE player_stats
            SET total_runs = total_runs + 1,
                last_run_result = 'In Progress'
            WHERE user_id = $1
        `,
    [userId]
  );
}
async function recordWordProgress(userId, word, runScore) {
  await ensureRow(userId);
  await db_default.query(
    `
            UPDATE player_stats
            SET best_score = GREATEST(best_score, $2),
                longest_word = CASE
                    WHEN CHAR_LENGTH($3) > CHAR_LENGTH(longest_word)
                    THEN $3
                    ELSE longest_word
                END
            WHERE user_id = $1
        `,
    [userId, runScore, word]
  );
}
async function recordRunResult(userId, result, enemiesDefeatedDelta) {
  await ensureRow(userId);
  await db_default.query(
    `
            UPDATE player_stats
            SET last_run_result = $2,
                enemies_defeated = enemies_defeated + $3
            WHERE user_id = $1
        `,
    [userId, result, enemiesDefeatedDelta]
  );
}

// src/modules/game/service.ts
async function startBattle(socket, forceReset = false) {
  const userId = socket.data.userData.id;
  let state = (await get(userId))?.gameState;
  if (!state || forceReset) {
    state = GameEngine.setupNewBattle();
    await set(userId, { gameState: state });
    await recordRunStarted(userId);
  }
  socket.emit("state_update", state);
}
async function continueStage(socket) {
  const userId = socket.data.userData.id;
  await updateGameState(userId, (state) => {
    if (!state) return state;
    const nextState = GameEngine.continueToNextStage(state);
    socket.emit("state_update", nextState);
    return nextState;
  });
}
async function submitWord(socket, letters) {
  const sessionId = socket.data.userData.id;
  let shouldRecordEnemyKill = false;
  let completedResult;
  let scoreToRecord = null;
  let longestWordCandidate = null;
  await updateGameState(sessionId, (state) => {
    if (!state || state.turn_owner !== "player" || state.status !== "running") {
      console.log(
        "ACTION BLOCKED - Not player's turn or battle not running"
      );
      console.log("State:", state);
      return state;
    }
    console.log("Processing Player Attack...");
    console.log("Enemy HP before attack:", state.enemy_hp);
    const submittedState = GameEngine.submitWord(state, letters);
    const wasSuccessful = submittedState.run_score > state.run_score;
    if (wasSuccessful) {
      const parsedWord = toWord(parseWord(letters, state.hand));
      scoreToRecord = submittedState.run_score;
      longestWordCandidate = parsedWord.toUpperCase();
    }
    let newState = submittedState;
    if (wasSuccessful && submittedState.status === "running") {
      newState = GameEngine.end_turn(submittedState);
    }
    if (newState.status === "finished" && newState.result && state.status !== "finished") {
      completedResult = newState.result;
      shouldRecordEnemyKill = newState.result === "ROUND_WON" || newState.result === "GAME_WON";
    }
    console.log("Enemy HP after attack:", newState.enemy_hp);
    socket.emit("state_update", newState);
    return newState;
  });
  if (scoreToRecord != null && longestWordCandidate) {
    await recordWordProgress(sessionId, longestWordCandidate, scoreToRecord);
  }
  if (completedResult) {
    await recordRunResult(
      sessionId,
      completedResult,
      shouldRecordEnemyKill ? 1 : 0
    );
  }
}
async function endTurn(socket) {
  const sessionId = socket.data.userData.id;
  let completedResult;
  await updateGameState(sessionId, (state) => {
    if (!state || state.turn_owner !== "player" || state.status !== "running") {
      console.log(
        "ACTION BLOCKED - Not player's turn or battle not running"
      );
      console.log("State:", state);
      return state;
    }
    const newState = GameEngine.end_turn(state);
    if (newState.status === "finished" && newState.result && state.status !== "finished") {
      completedResult = newState.result;
    }
    socket.emit("state_update", newState);
    return newState;
  });
  if (completedResult) {
    await recordRunResult(sessionId, completedResult, 0);
  }
}
async function discardLetters(socket, letters) {
  const sessionId = socket.data.userData.id;
  await updateGameState(sessionId, (state) => {
    if (!state || state.turn_owner !== "player" || state.status !== "running") {
      console.log(
        "ACTION BLOCKED - Not player's turn or battle not running"
      );
      console.log("State:", state);
      return state;
    }
    if (letters.length === 0 || !checkLetters(letters, state.hand)) {
      console.log("Discard rejected: selected letters are invalid");
      return state;
    }
    let nextState = {
      ...state,
      ...useLetters(letters, state.hand, state.discard)
    };
    nextState = {
      ...withoutFeedback2(nextState),
      ...drawLetters(
        nextState.hand,
        nextState.draw,
        nextState.discard,
        nextState.hand.length + letters.length
      )
    };
    socket.emit("state_update", nextState);
    return nextState;
  });
}
function disconnect(socket) {
  console.log(
    `User disconnected: ${socket.data.userData.username} / ${socket.id}`
  );
}
async function getProgress(userId) {
  const state = (await get(userId))?.gameState;
  const hasInProgressRun = state != null && !(state.status === "finished" && (state.result === "GAME_LOST" || state.result === "GAME_WON"));
  return {
    hasInProgressRun,
    currentStage: state?.level ?? 1,
    runScore: state?.run_score ?? 0,
    status: state?.status ?? "none",
    result: state?.result ?? null
  };
}
async function updateGameState(id, updater) {
  await update(id, (current) => {
    const nextGameState = updater(current.gameState);
    const next = { ...current, gameState: nextGameState };
    return next;
  });
}
function withoutFeedback2(state) {
  const { feedback: _feedback, ...rest } = state;
  return rest;
}

// src/modules/game/socket.ts
function connect(socket) {
  console.log("User connected:");
  console.table({
    "Session ID": socket.id,
    Username: socket.data.userData?.username
  });
  socket.onAny((eventName, ...args) => {
    console.log(
      `[EVENT RECEIVED] Name: ${eventName} | User: ${socket.data.userData?.username}`
    );
    console.log(`Payload:`, args);
  });
  socket.on("start_battle", async (forceReset) => {
    startBattle(socket, forceReset);
  });
  socket.on("continue_stage", async () => {
    continueStage(socket);
  });
  socket.on("submit_word", async (letters) => {
    submitWord(socket, letters);
  });
  socket.on("discard_letters", async (letters) => {
    discardLetters(socket, letters);
  });
  socket.on("end_turn", async () => {
    endTurn(socket);
  });
  socket.on("disconnect", () => {
    disconnect(socket);
  });
}

// src/modules/forum/routes.ts
var import_express2 = __toESM(require("express"), 1);

// src/modules/auth/middleware.ts
async function authMiddleware(req, res, next) {
  try {
    const user = await validateSession(req.cookies.token);
    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }
    res.locals.user = user;
    next();
  } catch {
    return res.status(500).json({ error: "Server error during authentication" });
  }
}

// src/modules/forum/service.ts
async function getAllPosts() {
  const result = await db_default.query(
    `
        SELECT
            fp.id,
            u.username,
            fp.content,
            fp.created_at
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        ORDER BY fp.created_at ASC
        `
  );
  return result.rows;
}
async function createPost(username, content) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  if (trimmed.length > 300) {
    throw new Error("Post must be 300 characters or fewer");
  }
  const userResult = await db_default.query(
    `SELECT id FROM users WHERE username = $1`,
    [username]
  );
  const userId = userResult.rows[0]?.id;
  if (!userId) return null;
  const insertResult = await db_default.query(
    `
        INSERT INTO forum_posts (user_id, content)
        VALUES ($1, $2)
        RETURNING id, content, created_at
        `,
    [userId, trimmed]
  );
  const created = insertResult.rows[0];
  return {
    id: created.id,
    username,
    content: created.content,
    created_at: created.created_at
  };
}

// src/modules/forum/controller.ts
async function getPosts(_req, res) {
  try {
    const posts = await getAllPosts();
    return res.status(200).json(posts);
  } catch {
    return res.status(500).json({ error: "Failed to load forum posts" });
  }
}
async function postPost(req, res) {
  try {
    const username = res.locals.user.username;
    const content = req.body.content?.toString() ?? "";
    if (!content.trim()) {
      return res.status(400).json({ error: "Post content is required" });
    }
    const createdPost = await createPost(username, content);
    if (!createdPost) {
      return res.status(400).json({ error: "Unable to create post" });
    }
    return res.status(201).json(createdPost);
  } catch (error) {
    if (error instanceof Error && error.message.includes("300")) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to create forum post" });
  }
}

// src/modules/forum/routes.ts
var router2 = import_express2.default.Router();
router2.get("/posts", authMiddleware, getPosts);
router2.post("/posts", authMiddleware, postPost);
var routes_default2 = router2;

// src/modules/game/routes.ts
var import_express3 = __toESM(require("express"), 1);

// src/modules/game/controller.ts
async function getStats(_req, res) {
  const user = res.locals.user;
  const stats = await getPlayerStats(user.id);
  return res.status(200).json(stats);
}
async function getRunProgress(_req, res) {
  const user = res.locals.user;
  const progress = await getProgress(user.id);
  return res.status(200).json(progress);
}

// src/modules/game/routes.ts
var router3 = import_express3.default.Router();
router3.get("/stats", authMiddleware, getStats);
router3.get("/progress", authMiddleware, getRunProgress);
var routes_default3 = router3;

// src/index.ts
var import_cookie = __toESM(require("cookie"), 1);
import_dotenv3.default.config();
var app = (0, import_express4.default)();
var PORT = process.env.PORT || 3e3;
var httpServer = (0, import_http.createServer)(app);
var io = new import_socket.Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use(import_express4.default.json());
app.use("/api", routes_default);
app.use("/api/forum", routes_default2);
app.use("/api/game", routes_default3);
io.use(async (socket, next) => {
  const rawCookies = socket.handshake.headers.cookie || "";
  const cookies = import_cookie.default.parse(rawCookies);
  const token = cookies.token;
  const userData = token ? await validateSession(token) : null;
  if (!token || !userData) {
    return next(new Error("Authentication error"));
  }
  socket.data.userData = userData;
  next();
});
io.on("connection", (socket) => {
  connect(socket);
});
httpServer.listen(PORT, () => {
  console.log(
    `Granny's Last Word Server running on http://localhost:${PORT}`
  );
});
