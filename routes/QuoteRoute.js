const express = require("express"),
  router = express.Router();
const passport = require("passport");

const Quotes = require("../models/Quotes");
const Sentry = require("@sentry/node");

const QuoteRoute = router.get(
  "/quotes",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const { _id, tags } = req.user;
      let { limit } = req.query;
      limit = parseInt(limit);

      if (!limit || limit > 30 || limit < 1) {
        limit = 15;
      }

      const quotes = await Quotes.aggregate([
        {
          $match: {
            tags: {
              $in: tags,
            },
          },
        },
        {
          $sort: {
            like_count: -1,
          },
        },
        {
          $lookup: {
            from: "votes",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_user_id", _id],
                      },
                      {
                        $eq: ["$_quote_id", "$$id"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "votes",
          },
        },
        {
          $match: { votes: { $size: 0 } },
        },
        {
          $project: {
            quote: 1,
            title: 1,
            author: 1,
          },
        },
        { $limit: limit },
      ]);

      res.send(quotes);
    } catch (e) {
      Sentry.captureException(e);
      next(e);
    }
  }
);

module.exports = QuoteRoute;
