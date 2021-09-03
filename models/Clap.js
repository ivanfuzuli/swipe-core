const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Clap = new Schema(
  {
    _user_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    _quote_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
    created_at: Number,
    updated_at: Number,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Clap", Clap);
