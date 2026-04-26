CREATE TABLE IF NOT EXISTS "User" (
  user_id       SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  current_score INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Session" (
  session_id  VARCHAR(64) PRIMARY KEY,
  user_id     INT REFERENCES "User"(user_id) ON DELETE CASCADE,
  expires_at  TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Score" (
  score_id    SERIAL PRIMARY KEY,
  user_id     INT REFERENCES "User"(user_id) ON DELETE CASCADE,
  score_value INT NOT NULL,
  timestamp   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GameState" (
  state_id      SERIAL PRIMARY KEY,
  user_id       INT REFERENCES "User"(user_id) ON DELETE CASCADE,
  player_hp     INT NOT NULL,
  current_score INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "BattleState" (
  state_id      INT PRIMARY KEY REFERENCES "GameState"(state_id) ON DELETE CASCADE,
  user_id       INT REFERENCES "User"(user_id) ON DELETE CASCADE,
  deck_id       INT,
  turn_owner    VARCHAR(10) DEFAULT 'player',
  current_state VARCHAR(20) DEFAULT 'active',
  enemy_hp      INT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Deck" (
  deck_id      SERIAL PRIMARY KEY,
  state_id     INT REFERENCES "BattleState"(state_id) ON DELETE CASCADE,
  current_hand TEXT[] DEFAULT '{}',
  draw_pile    TEXT[] DEFAULT '{}',
  discard_pile TEXT[] DEFAULT '{}'
);

ALTER TABLE "BattleState"
  ADD CONSTRAINT fk_deck
  FOREIGN KEY (deck_id) REFERENCES "Deck"(deck_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS "UsedWords" (
  word_id   SERIAL PRIMARY KEY,
  state_id  INT REFERENCES "BattleState"(state_id) ON DELETE CASCADE,
  word_text VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "ForumPost" (
  post_id     SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
  content     VARCHAR(300) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);