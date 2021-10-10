const express = require("express"),
  router = express.Router();
const passport = require("passport");

const User = require("../models/User");
const Sentry = require("@sentry/node");
const createError = require("http-errors");

const MeRoute = router.get(
  "/me/:sub",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      let { sub } = req.params;
      const { _id } = req.user;

      const id = sub === "info" ? _id : sub;
      const user = await User.findOne({ _id: id }, { username: 1 });
      if (!user) {
        return next(createError(406, "User not exists!"));
      }

      res.send(user);
    } catch (e) {
      console.log("ee", e);
      Sentry.captureException(e);
      next(e);
    }
  }
);

module.exports = MeRoute;
