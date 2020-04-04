const bcrypt = require("bcryptjs");

//bcrypt functions are not promisified
let { genSalt, hash, compare } = bcrypt;
// if you didn't destructure, you'd later have to invoke using bcrypt.hash etc.

const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

genSalt()
    .then(salt => {
        // console.log("salt created by bcrypt: ", salt);
        return hash("safePassword", salt);
    })
    //add salt to make the returned string safer
    .then(hashedPw => {
        // console.log("hashedPw plus salt output: ", hashedPw);
        // if you entered a different password, compare would return false
        return compare("safePassword", hashedPw);
    });
// .then(matchValueCompare => {
//     console.log("password is a match: ", matchValueCompare);
// });

module.exports.compare = compare;
// export the hash function so that it already does the salt stuff
module.exports.hash = plainText =>
    genSalt().then(salt => hash(plainText, salt));

//safe password hashed = $2a$10$fpJzEfxOt.8i8tCun3q0/u
//safe password including salt + hashed = $2a$10$fpJzEfxOt.8i8tCun3q0/uWzXFDfdVo22rRquYRHt.7oHfpWhwcMW
