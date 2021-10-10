const express = require("express"),
  router = express.Router();
const passport = require("passport");
const Clap = require("../models/Clap");
const Sentry = require("@sentry/node");

const FeedRoute = router.get(
  "/feed",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    let { limit = 15, offset = 0 } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);

    if (limit > 50) {
      limit = 50;
    }

    try {
      const total = await Clap.find({}).countDocuments();
      const quotes = await Clap.aggregate([
        {
          $sort: { updated_at: -1 },
        },
        {
          $lookup: {
            from: "quotes",
            localField: "_quote_id",
            foreignField: "_id",
            as: "quote",
          },
        },
        {
          $unwind: {
            path: "$quote",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
          },
        },

        {
          $project: {
            count: 1,
            updated_at: 1,
            _quote_id: 1,
            user: {
              _id: 1,
              username: 1,
            },
            quote: {
              _id: 1,
              title: 1,
              author: 1,
              quote: 1,
            },
          },
        },
        {
          $skip: offset,
        },
        {
          $limit: limit,
        },
      ]);

      res.setHeader("X-Total-Count", total);
      res.send(quotes);
    } catch (e) {
      console.log("ee", e);
      Sentry.captureException(e);
      return next(e);
    }
  }
);

module.exports = FeedRoute;
