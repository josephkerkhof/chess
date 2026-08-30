INSERT INTO users (public_id, name)
VALUES
  ('01890f4e-93ad-7cc4-8a8f-5b2966e01465', 'Ada'),
  ('01890f4e-93ad-7cc4-8a8f-5b2966e01466', 'Grace')
ON CONFLICT (public_id) DO UPDATE SET
  name = excluded.name,
  updated_at = CURRENT_TIMESTAMP;
