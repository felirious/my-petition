const spicedPg = require("spiced-pg");

// // if you're requiring password from a secrets.json, then
// let db;
// if(process.env.DATABASE_URL) {db = spicedPg(process.env.DATABASE_URL)} else ...
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres://postgres:postgres@localhost:5432/petition"
);

exports.addSigner = function(userID, sig) {
    return db.query(
        `INSERT INTO signatures (userid, signature) VALUES
        ($1, $2)
        RETURNING id`,
        [userID, sig]
    );
};

// users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.homepage AS homepage

exports.getSigners = function() {
    return db.query(`SELECT *
    FROM signatures
    LEFT JOIN users
    ON users.userID = signatures.userID
    LEFT JOIN user_profiles
    ON user_profiles.userID = signatures.userID`);
    // join and then get from users (signatures doesn't have names anymore)
};

// determine number of signers
exports.count = function() {
    return db.query(`SELECT COUNT(*) AS "count" FROM petition`);
};

exports.getSignature = function(id) {
    return db.query(`SELECT signature FROM signatures WHERE userid=${id}`);
};

exports.addUser = function(first, last, email, hashedPw) {
    return db.query(
        `INSERT INTO users (first, last, email, hashedPw) VALUES
        ($1, $2, $3, $4)
        RETURNING userID`,
        [first || null, last || null, email, hashedPw]
    );
    // the || stuff changes to null if user input is an empty string
};

exports.getPasswordFromEmail = function(value) {
    return db.query(
        `SELECT hashedPw, userID FROM users WHERE email='${value}'`
    );
};

exports.checkIfUserSigned = function(userID) {
    return db.query(`SELECT id FROM signatures WHERE userid ='${userID}'`);
};

//part 4
exports.createUserProfile = function(age, city, homepage, userID) {
    return db.query(
        `INSERT INTO user_profiles (age, city, homepage, userID) VALUES
        ($1, $2, $3, $4)`,
        [age || null, city || null, homepage || null, userID || null]
    );
};

exports.getSignersFromCity = function(city) {
    return db.query(`SELECT *
    FROM signatures
    LEFT JOIN users
    ON users.userID = signatures.userID
    LEFT JOIN user_profiles
    ON user_profiles.userID = signatures.userID
    WHERE user_profiles.city ='${city}'`);
};

///////////////////////////////////////
//////////// part 5 ///////////////////
///////////////////////////////////////
exports.updateUserInfo = function(first, last, email, password, userID) {
    return db.query(
        `UPDATE users SET first = ($1), last = ($2), email = ($3), hashedPw = ($4)
        WHERE userID = ($5)`,
        [first || null, last || null, email || null, password, userID]
    );
};

exports.prepopulateProfileInfo = function(userID) {
    return db.query(`SELECT *
FROM user_profiles
LEFT JOIN users
ON users.userID = user_profiles.userID
WHERE user_profiles.userID ='${userID}'`);
};

// exports.getPasswordFromID = function(value) {
//     return db.query(`SELECT hashedPw FROM users WHERE userID=${value}`);
// };

exports.updateUserInfoWithoutPw = function(first, last, email, userID) {
    return db.query(
        `UPDATE users SET first = ($1), last = ($2), email = ($3)
        WHERE userID = ($4)`,
        [first || null, last || null, email || null, userID]
    );
};

exports.updateUserProfile = function(age, city, homepage, userID) {
    return db.query(
        `UPDATE user_profiles SET age = ($1), city = ($2), homepage = ($3) WHERE userID = ($4)`,
        [age || null, city || null, homepage || null, userID]
    );
};

exports.deleteSignature = function(userID) {
    return db.query(`DELETE FROM signatures WHERE userID = ($1)`, [userID]);
};
