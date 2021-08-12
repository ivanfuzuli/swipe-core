const mongoose = require("mongoose");
const QuoteSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    tags: {
      type: [],
      required: true,
    },
    created_at: Number,
    updated_at: Number,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Quote", QuoteSchema);
