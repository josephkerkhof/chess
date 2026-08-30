-- Migration number: 0002 	 2026-08-29T04:07:19.669Z

CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,

  white_user_id INTEGER NOT NULL REFERENCES users(id),
  black_user_id INTEGER NOT NULL REFERENCES users(id),

  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'abandoned', 'completed')),
  fen TEXT NOT NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (white_user_id <> black_user_id)
);

CREATE INDEX games_white_user_id_idx ON games(white_user_id);
CREATE INDEX games_black_user_id_idx ON games(black_user_id);

-- automatically set the updated_at time
CREATE TRIGGER update_games_updated_at
AFTER UPDATE ON games
FOR EACH ROW
WHEN OLD.updated_at IS NEW.updated_at
BEGIN
  UPDATE games
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;
