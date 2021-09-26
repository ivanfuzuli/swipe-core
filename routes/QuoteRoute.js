const express = require("express"),
  router = express.Router();
const passport = require("passport");

const Quotes = require("../models/Quotes");
const Vote = require("../models/Vote");

const Sentry = require("@sentry/node");
const ObjectID = require("mongodb").ObjectID;

router.get(
  "/quotes/:id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { id } = req.params;

    try {
      const result = await Vote.aggregate([
        { $match: { _quote_id: ObjectID(id) } },
        {
          $lookup: {
            from: "users",
            localField: "_user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $project: { "user._id": 1, "user.username": 1 } },
        { $unwind: "$user" },
      ]);
      res.send(result);
    } catch (e) {
      Sentry.captureException(e);
      next(e);
    }
  }
);

router.get(
  "/quotes",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const { _id, tags } = req.user;
      let { limit } = req.query;
      limit = parseInt(limit);

      if (!limit || limit > 50 || limit < 1) {
        limit = 50;
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
            liked_by: 1,
            liked_by_count: 1,
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

module.exports = router;
