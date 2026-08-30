CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,

  name TEXT NOT NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- automatically set the updated_at time
CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN OLD.updated_at IS NEW.updated_at
BEGIN
  UPDATE users
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;
