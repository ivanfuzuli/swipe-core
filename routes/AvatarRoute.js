const { createAvatar } = require("@dicebear/avatars");
const style = require("@dicebear/avatars-bottts-sprites");
const express = require("express"),
  router = express.Router();
const passport = require("passport");

const Sentry = require("@sentry/node");

const AvatarRoute = router.get("/avatar/:seed", async (req, res, next) => {
  let { seed = "none" } = req.params;
  try {
    let svg = createAvatar(style, {
      seed,
      // ... and other options
    });

    req.header("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (e) {
    Sentry.captureException(e);
    return next(e);
  }
});

module.exports = AvatarRoute;
