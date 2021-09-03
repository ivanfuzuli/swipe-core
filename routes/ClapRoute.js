const express = require("express"),
  router = express.Router();
const passport = require("passport");
const { subDays, getTime } = require("date-fns");
const createError = require("http-errors");
const Clap = require("../models/Clap");
const Sentry = require("@sentry/node");

const ClapRoute = router.get(
  "/claps",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    let { limit = 15, offset = 0, filter = null, sort = "newest" } = req.query;
    const { _id } = req.user;

    limit = parseInt(limit);
    offset = parseInt(offset);

    if (limit > 100) {
      limit = 100;
    }

    let sortBy = {
      _id: -1,
    };

    if (sort === "popular") {
      sortBy = {
        count: -1,
        _id: -1,
      };
    }

    const getMatchGte = () => {
      let greater = null;
      switch (filter) {
        case "day":
          greater = subDays(new Date(), 1);
          break;
        case "week":
          greater = subDays(new Date(), 7);
          break;
        case "month":
          greater = subDays(new Date(), 30);
          break;
        default:
          greater = null;
          break;
      }

      if (greater) {
        return {
          updated_at: {
            $gte: getTime(greater),
          },
        };
      }

      return {};
    };

    try {
      const total = await Clap.find({
        _user_id: _id,
        ...getMatchGte(),
      }).count();
      const quotes = await Clap.aggregate([
        {
          $match: {
            _user_id: _id,
            ...getMatchGte(),
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
            updated_at: 1,
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
      Sentry.captureException(e);
      return next(e);
    }
  }
);

module.exports = ClapRoute;
