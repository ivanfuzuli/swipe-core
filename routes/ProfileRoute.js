const express = require("express"),
  router = express.Router();
const passport = require("passport");

const ProfileRoute = router.post(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    res.send(req.user.profile);
  }
);

module.exports = ProfileRoute;
