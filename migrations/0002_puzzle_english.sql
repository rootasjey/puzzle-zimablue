ALTER TABLE puzzles ADD COLUMN title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE puzzles ADD COLUMN note_en TEXT NOT NULL DEFAULT '';

UPDATE puzzles SET title_en = 'A Sun for Two', note_en = 'Come along, I’ll take you to my blue paradise.' WHERE date = '2026-10-12';
UPDATE puzzles SET title_en = 'Biscotte Paper Plane', note_en = 'Biscotte takes flight.' WHERE date = '2026-10-11';
UPDATE puzzles SET title_en = 'Astronaut', note_en = 'A little trip into space.' WHERE date = '2026-10-10';
