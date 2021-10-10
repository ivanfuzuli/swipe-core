const mongoose = require("mongoose");
const QuoteSchema = new mongoose.Schema({
  tags: {
    type: [],
  },
  liked_by: {
    type: [],
  },
  liked_by_count: {
    type: Number,
  },
  quote: {
    type: String,
  },
  title: {
    type: String,
  },
  author: {
    type: String,
  },
  like_count: {
    type: Number,
  },
  sha1: {
    type: String,
  },
});

module.exports = mongoose.model("Quote", QuoteSchema);
