const express = require("express"),
  router = express.Router();
const passport = require("passport");

const Vote = require("../models/Vote");
const Quote = require("../models/Quotes");

const Clap = require("../models/Clap");
const Sentry = require("@sentry/node");

const VoteRoute = router.post(
  "/votes",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { _id } = req.user;
    const votes = req.body;

    try {
      const votesWithUser = votes
        .filter((vote) => vote.type !== "clap")
        .map((vote) => {
          return {
            _user_id: _id,
            _quote_id: vote.quote_id,
            like: vote.like,
          };
        });

      const clapsWithUser = votes
        .filter((vote) => vote.type === "clap")
        .map((clap) => {
          return {
            _user_id: _id,
            _quote_id: clap.quote_id,
            count: clap.count,
          };
        });

      if (clapsWithUser.length > 0) {
        await Clap.bulkWrite(
          clapsWithUser.map((clap) => ({
            updateOne: {
              filter: { _user_id: clap._user_id, _quote_id: clap._quote_id },
              update: { $set: clap },
              upsert: true,
            },
          }))
        );
      }
      await Vote.insertMany(votesWithUser);

      for (const vote of votesWithUser) {
        await Quote.updateOne(
          { _id: vote.quote_id },
          {
            $push: {
              liked_by: {
                $each: [_id],
                $slice: -3,
              },
            },
            $inc: {
              liked_by_count: 1,
            },
          }
        );
      }
      res.send({ message: "success" });
    } catch (e) {
      Sentry.captureException(e);
      return next(e);
    }
  }
);

module.exports = VoteRoute;
