const db = require("./utils/database.js");
const express = require("express");
const app = (exports.app = express());
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
// const secrets = require("./utils/secrets.json");
const csurf = require("csurf");
const { hash, compare } = require("./utils/bcrypt.js");
const chalk = require("chalk");
const mw = require("./utils/middleware.js");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// to prevent clickjacking
app.use(function(req, res, next) {
    res.set("x-frame-options", "DENY");
    next();
});

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use("/favicon.ico", (req, res) => res.sendStatus(404));

// add these lines to prevent heroku from throwing errors
let secrets;
process.env.NODE_ENV === "production"
    ? (secrets = process.env)
    : (secrets = require("./utils/secrets.json"));

app.use(
    cookieSession({
        secret: secrets["cookieSessionSecret"],
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf());

// app.use(function(req, res, next) {
//     // console.log("req.cookies: ", req.cookies);
//     if (req.url == "/login" || req.url == "/registration") {
//         next();
//     } else if (!req.session.userID && req.url != "/registration") {
//         res.redirect("/registration");
//     } else {
//         next();
//     }
// });

app.use((req, res, next) => {
    res.locals.csrfToken = null;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get("/", (req, res) => {
    // console.log("******* / ROUTE ****************");
    // console.log("******* / ROUTE ****************");
    // console.log(req.session);
    req.session.allspice = "<3";
    // console.log(req.session);
    res.redirect("/registration");
});

app.get("/welcome", (req, res) => {
    res.send("<h1>YOOOOOOOOOOOOOO</h1>");
    res.sendStatus(200);
});

app.post("/welcome", (req, res) => {
    req.session.submitted = true;
    res.redirect("/home");
});

app.get("/home", (req, res) => {
    if (!req.session.submitted) {
        return res.redirect("/welcome");
    }
    res.send("<h1>HOOOOOME</h1>");
});

app.get("/petition", (req, res) => {
    // console.log(req.session.userID);
    if (req.session.userID) {
        res.render("petition", {
            layout: "main"
        });
    } else {
        res.redirect("/registration");
    }
});

app.post("/petition", (req, res) => {
    // console.log(req.body);
    // console.log("req.session in post: ", req.session);
    var sig = req.body.sig;
    // console.log("sig: ", sig);
    let userID = req.session.userID;
    // console.log("userID: ", userID);
    db.addSigner(userID, sig).then(() => {
        // console.log("id: ", id);
        // console.log("req.session: ", req.session);
        // req.session.signed = true;
        // req.session.signerID = results.rows[0].id;
        // console.log("req.session.signed: ", req.session.signed);
        res.redirect("/thanks");
    });
});

app.get("/thanks", (req, res) => {
    // console.log("GET /thanks");
    // console.log("userid: ", req.session.userID);
    db.getSignature(req.session.userID)
        .then(results => {
            // console.log("results in thanks: ", results);
            if (results.rows.length == 0) {
                // console.log("redirecting to /petition");
                res.redirect("/petition");
            } else {
                let sigimage = results.rows[0].signature;
                let thanks = true;
                res.render("thanks", {
                    layout: "main",
                    thanks,
                    sigimage
                });
            }
        })
        .catch(err => {
            console.log("err in signature: ", err);
            return res.render("thanks", {
                layout: "main",
                err
            });
        });
});

app.get("/signers", (req, res) => {
    db.getSigners()
        .then(({ rows }) => {
            // console.log("rows: ", rows);
            res.render("signers", {
                layout: "main",
                rows
            });
        })
        .catch(err => {
            console.log("error in getSigners: ", err);
            return res.render("signers", {
                layout: "main",
                err
            });
        });
});

app.get("/registration", (req, res) => {
    // would've to do this for 4 routes (register and login, get and post),
    // better to write middleware
    // if (req.session.userID) {
    //     return res.redirect("/petition");
    // }
    res.render("registration", {
        layout: "main"
    });
});

app.post("/registration", (req, res) => {
    let { first, last, email, newPassword } = req.body;
    hash(newPassword)
        .then(hashedPw => {
            // console.log(hashedPw);
            db.addUser(first, last, email, hashedPw)
                .then(results => {
                    // console.log("results: ", results);
                    req.session.userID = results.rows[0].userid;
                    // console.log(req.session.userID);
                    console.log(chalk.red.bgBlue("hi I just registered"));
                    res.redirect("/profile");
                })
                .catch(err => {
                    console.log("err: ", err);
                    res.render("registration", {
                        layout: "main",
                        err
                    });
                });
        })
        .catch(err => {
            console.log("err: ", err);
            return res.render("registration", {
                layout: "main",
                err
            });
        });
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", (req, res) => {
    //compare when user logs in: compare takes two arguments:
    // 1)the input and 2) the string retrieved from the database
    // if they match it returns true
    var password = req.body.password;
    var email = req.body.email;
    // console.log("email: ", email);
    // console.log("password: ", password);
    db.getPasswordFromEmail(email)
        .then(results => {
            // console.log(results);
            var { hashedpw, userid } = results.rows[0];
            // if passwords match, redirect to "/petition" and do cookie stuff
            compare(password, hashedpw).then(matchValue => {
                // console.log("results: ", results);
                if (matchValue == true) {
                    req.session.userID = userid;
                    // console.log("userid rn: ", userid);
                    db.checkIfUserSigned(userid)
                        .then(sigID => {
                            // console.log("sigID: ", sigID);
                            req.session.sigID = sigID;
                            res.redirect("/thanks");
                        })
                        .catch(err => {
                            console.log("err in checkIfUserSigned: ", err);
                            return res.render("login", {
                                layout: "main",
                                err
                            });
                        });
                } else {
                    // if they don't match, send error message
                    res.redirect("/login");
                }
            });
        })
        .catch(err => {
            console.log("err in chain: ", err);
            return res.render("login", {
                layout: "main",
                err
            });
        });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    console.log(chalk.red.bgBlue("hi what's the matter?"));
    var { age, city, homepage } = req.body;
    // console.log("req.session: ", req.session);
    let userID = req.session.userID;
    if (homepage.startsWith("http://") || homepage.startsWith("https://")) {
        // console.log("USERid: ", userID);
        db.createUserProfile(age, city, homepage, userID)
            .then(() => {
                console.log("this is where I am");
                res.render("profileCreated", {
                    layout: "main"
                });
            })
            .catch(err => {
                console.log("error: ", err);
                return res.render("profile", {
                    layout: "main",
                    err
                });
            });
        // add something here to say email could not be added
    } else {
        db.createUserProfile(age, city, null, userID)
            .then(() => {
                res.render("profileCreated", {
                    layout: "main"
                });
            })
            .catch(err => {
                console.log("error: ", err);
                return res.render("profile", {
                    layout: "main",
                    err
                });
            });
    }
    console.log(chalk.green.bgRed("redirecting to profile"));
});

app.get("/signers/:city", (req, res) => {
    let city = req.params.city;
    db.getSignersFromCity(city)
        .then(({ rows }) => {
            // console.log(chalk.red.bgGreen("rows"));
            // console.log(rows);
            res.render("signers-in-city", {
                layout: "main",
                rows,
                city
            });
        })
        .catch(err => {
            console.log("err in cities: ", err);
            return res.render("signers-in-sity", {
                layout: "main",
                err
            });
        });
});

app.get("/edit-profile", (req, res) => {
    let userID = req.session.userID;
    // prepopulate input fields
    db.prepopulateProfileInfo(userID).then(({ rows }) => {
        let info = rows[0];
        let edit = true;
        res.render("edit-profile", {
            layout: "main",
            info,
            edit
        });
    });
});

app.post("/edit-profile", (req, res) => {
    // declare variables
    var userID = req.session.userID;
    var { first, last, email, password, age, city, homepage } = req.body;
    if (password != "") {
        hash(password)
            .then(hashedPw => {
                db.updateUserInfo(first, last, email, hashedPw, userID);
            })
            .catch(err => {
                console.log(chalk.red.bgGreen("hi"));
                console.log("err: ", err);
                return res.render("edit-profile", {
                    layout: "main",
                    err
                });
            });
    } else {
        db.updateUserInfoWithoutPw(first, last, email, userID).catch(err => {
            console.log("err: ", err);
            return res.render("edit-profile", {
                layout: "main",
                err
            });
        });
    }
    db.updateUserProfile(age, city, homepage, userID)
        .catch(err => {
            console.log("err in profile-edit: ", err);
            return res.render("edit-profile", {
                layout: "main",
                err
            });
        })
        .then(success => {
            res.render("edit-profile", {
                layout: "main",
                success
            });
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

app.post("/signature/delete", (req, res) => {
    let userID = req.session.userID;
    db.deleteSignature(userID).then(() => {
        res.render("thanks", {
            layout: "main",
            deleted: true,
            thanks: false
        });
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log("port 8080 listening, petition running!!");
});
