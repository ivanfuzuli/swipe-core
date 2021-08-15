const express = require("express"),
  router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const Sentry = require("@sentry/node");

const createError = require("http-errors");

const LoginRouter = router.post("/login", async (req, res, next) => {
  passport.authenticate("login", async (err, user, info) => {
    try {
      if (err || !user) {
        const error = createError(403, "E-mail or password is not valid.");
        return next(error);
      }

      req.login(user, { session: false }, async (error) => {
        if (error) {
          return next(error);
        }

        const hasTags = user.tags.length > 0;
        const body = { sub: user._id, email: user.email };
        const token = jwt.sign(body, process.env.JWT_SECRET);

        return res.json({ token, hasTags });
      });
    } catch (e) {
      Sentry.captureException(e);
      return next(e);
    }
  })(req, res, next);
});

module.exports = LoginRouter;
