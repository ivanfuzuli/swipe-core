const express = require("express"),
  router = express.Router();
const ObjectId = require("mongodb").ObjectID;
const passport = require("passport");

const Vote = require("../models/Vote");
const Quotes = require("../models/Quotes");
const User = require("../models/User");

const QuoteRoute = router.get(
  "/quotes",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    const { _id, tags } = req.user;

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
      { $limit: 15 },
    ]);

    res.send(quotes);
  }
);

module.exports = QuoteRoute;
