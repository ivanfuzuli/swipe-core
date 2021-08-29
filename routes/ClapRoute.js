const express = require("express"),
  router = express.Router();
const passport = require("passport");

const createError = require("http-errors");
const Clap = require("../models/Clap");

const ClapRoute = router.get(
  "/claps",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { limit = 15, offset = 0, sort = "newest" } = req.body;
    const { _id } = req.user;

    if (limit > 100) {
      limit = 100;
    }

    let sortBy = {
      _id: 1,
    };

    if (sort === "popular") {
      sortBy = {
        count: -1,
        _id: 1,
      };
    }

    try {
      const quotes = await Clap.aggregate([
        {
          $match: {
            _user_id: _id,
          },
        },
        {
          $sort: sortBy,
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
          $project: {
            count: 1,
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

      res.send(quotes);
    } catch (e) {
      Sentry.captureException(e);
      return next(e);
    }
  }
);

module.exports = ClapRoute;
