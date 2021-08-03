const express = require("express"),
  router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const Vote = require("../models/Vote");
const Quotes = require("../models/Quotes");

const QuoteRoute = router.get("/quotes", async function (req, res) {
  const quotes = await Quotes.aggregate([
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
    { $limit: 15 },
  ]);

  res.send(quotes);
});

module.exports = QuoteRoute;
