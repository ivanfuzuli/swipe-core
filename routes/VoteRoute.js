const express = require("express"),
  router = express.Router();
const ObjectId = require("mongodb").ObjectID;
const Vote = require("../models/Vote");

const VoteRoute = router.post("/vote", async function (req, res) {
  const { user_id, quote_id, like } = req.body;

  const vote = new Vote({
    _user_id: ObjectId(user_id),
    _quote_id: ObjectId(quote_id),
    like,
  });

  await vote.save();
  res.send({ message: "ok" });
});

module.exports = VoteRoute;
