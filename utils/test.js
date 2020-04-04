return db.query(
    `INSERT INTO users (first, last, email, userID) VALUES
    ($1, $2, $3, $4)
    ON CONFLICT (userID)
    DO UPDATE SET first = ($1), last = ($2), email = ($3)`,
    [first || null, last || null, email || null, userID]
);
