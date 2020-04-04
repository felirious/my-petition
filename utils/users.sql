DROP TABLE IF EXISTS users;

CREATE TABLE users (
	userID SERIAL PRIMARY KEY UNIQUE,
	first VARCHAR NOT NULL CHECK(first != ''),
	last VARCHAR NOT NULL CHECK(last != ''),
    email VARCHAR NOT NULL UNIQUE CHECK(email != ''),
	hashedPw VARCHAR NOT NULL UNIQUE CHECK(hashedPw != ''),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
