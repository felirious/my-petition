DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR,
    homepage VARCHAR,
    -- referential integrity; might make deletions more difficult
    userID INTEGER NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
