exports.requireLoggedOutUser = function(req, res, next) {
    if (req.session.userID) {
        return res.redirect("/petition");
    } else {
        next();
    }
};

exports.requireNoSignature = function(req, res, next) {
    if (req.session.sigID) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

exports.requireSignature = function(req, res, next) {
    if (req.session.sigID) {
        next();
    } else {
        res.redirect("/petition");
    }
};
