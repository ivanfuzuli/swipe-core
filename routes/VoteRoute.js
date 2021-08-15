const express = require("express"),
  router = express.Router();
const passport = require("passport");

const Vote = require("../models/Vote");
const Sentry = require("@sentry/node");

const VoteRoute = router.post(
  "/votes",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { _id } = req.user;
    const votes = req.body;

    try {
      const votesWithUser = votes.map((vote) => {
        return {
          _user_id: _id,
          _quote_id: vote.quote_id,
          like: vote.like,
        };
      });

      await Vote.insertMany(votesWithUser);
      res.send({ message: "success" });
    } catch (e) {
      Sentry.captureException(e);
      return next(e);
    }
  }
);

module.exports = VoteRoute;
