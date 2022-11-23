CREATE TABLE IF NOT EXISTS managers(
    user INT
);

CREATE TABLE IF NOT EXISTS whitelist(
    guild INTEGER,
    channel INTEGER,
    enabled BOOLEAN
);

CREATE TABLE IF NOT EXISTS packs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    banned BOOLEAN
);

CREATE TABLE IF NOT EXISTS starting(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER REFERENCES packs(id),
    round INTEGER, -- lượt khởi động
    question TEXT,
    answer TEXT,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS obstacle(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER REFERENCES packs(id),
    answer TEXT,
    image_url TEXT,
    display_type INTEGER -- 0: ký tự, 1: chữ cái, 2: chữ số
);

CREATE TABLE IF NOT EXISTS obstacle_questions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obstacle_id INTEGER REFERENCES obstacle(id),
    row INTEGER, -- 0: ô trung tâm
    question TEXT,
    answer TEXT
);

CREATE TABLE IF NOT EXISTS acceleration(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER REFERENCES packs(id),
    question TEXT,
    answer TEXT,
    answer_image_url TEXT,
    first_image_with_question BOOLEAN
);

CREATE TABLE IF NOT EXISTS acceleration_images(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acceleration_id REFERENCES acceleration(id),
    ord INTEGER,
    image_url TEXT,
    image_time FLOAT -- leave 0 for autosplit
);

CREATE TABLE IF NOT EXISTS finish(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER REFERENCES packs(id),
    rnd INTEGER,
    score INTEGER,
    question TEXT,
    answer TEXT,
    image_url TEXT,
    explanation TEXT
);

CREATE TABLE IF NOT EXISTS chp(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER REFERENCES packs(id),
    question TEXT,
    answer TEXT
);
