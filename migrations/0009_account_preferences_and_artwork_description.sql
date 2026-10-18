ALTER TABLE users ADD COLUMN show_reference_image INTEGER NOT NULL DEFAULT 1 CHECK (show_reference_image IN (0, 1));
ALTER TABLE users ADD COLUMN reduce_motion INTEGER NOT NULL DEFAULT 0 CHECK (reduce_motion IN (0, 1));
ALTER TABLE users ADD COLUMN sound_enabled INTEGER NOT NULL DEFAULT 1 CHECK (sound_enabled IN (0, 1));
ALTER TABLE users ADD COLUMN sound_volume INTEGER NOT NULL DEFAULT 100 CHECK (sound_volume BETWEEN 0 AND 100);
ALTER TABLE users ADD COLUMN avatar_seed TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN avatar_variant TEXT NOT NULL DEFAULT 'marble' CHECK (avatar_variant IN ('marble', 'bauhaus', 'beam', 'pixel', 'ring', 'sunset'));

ALTER TABLE puzzles ADD COLUMN image_description TEXT NOT NULL DEFAULT '';
ALTER TABLE weekly_puzzles ADD COLUMN image_description TEXT NOT NULL DEFAULT '';
