const express = require("express"),
  router = express.Router();
const passport = require("passport");
const createError = require("http-errors");
const User = require("../models/User");
const Vote = require("../models/Vote");

const Sentry = require("@sentry/node");

router.put(
  "/email",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { email } = req.user;
    const { newEmail, password } = req.body;
    if (!newEmail) {
      return next(createError(406, "New E-mail is required!"));
    }
    if (!password) {
      return next(createError(406, "Password is required!"));
    }

    let emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(createError(403, "E-mail is already exists."));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(createError(406, "User not exists!"));
    }

    const validate = await user.isValidPassword(password);
    if (!validate) {
      return next(createError(406, "Wrong password!"));
    }

    try {
      await User.updateOne(
        {
          email,
        },
        {
          $set: {
            email: newEmail,
          },
        }
      );
    } catch (e) {
      Sentry.captureException(e);
      return next(createError(406, "E-mail couldn't saved! DB error."));
    }

    res.send({
      success: true,
    });
  }
);

router.put(
  "/username",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { email } = req.user;
    const { username } = req.body;
    if (!username) {
      return next(createError(406, "Username is required!"));
    }

    let usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return next(createError(403, "Username already exists."));
    }

    try {
      await User.updateOne(
        {
          email,
        },
        {
          $set: {
            username,
          },
        }
      );
    } catch (e) {
      Sentry.captureException(e);
      return next(createError(406, "Username couldn't saved!"));
    }

    res.send({
      success: true,
    });
  }
);

router.put(
  "/password",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { email } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return next(createError(406, "Old password is required!"));
    }

    if (!newPassword) {
      return next(createError(406, "New password is required!"));
    }

    if (newPassword.length < 4) {
      return next(
        createError(406, "New password should be least 4 character!")
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(createError(406, "User not exists!"));
    }

    const validate = await user.isValidPassword(oldPassword);
    if (!validate) {
      return next(createError(406, "Wrong old password!"));
    }

    try {
      user.password = newPassword;
      await user.save();
    } catch (e) {
      Sentry.captureException(e);
      return next(createError(406, "Password couldn't saved!"));
    }

    res.send({
      success: true,
    });
  }
);

router.put(
  "/tags",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { tags } = req.body;
    const { _id } = req.user;

    if (!tags || tags.length < 1) {
      return next(createError(406, "There should be at least one tag!"));
    }

    try {
      await User.updateOne(
        { _id },
        {
          $set: {
            tags,
          },
        }
      );
    } catch (e) {
      Sentry.captureException(e);
      return next(createError(406, "Unexpected db error!"));
    }

    res.send({
      success: true,
    });
  }
);

router.post(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { email } = req.user;
    const { password } = req.body;

    if (!password) {
      return next(createError(406, "Password is required!"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(createError(406, "User not exists!"));
    }

    const validate = await user.isValidPassword(password);
    if (!validate) {
      return next(createError(406, "Wrong old password!"));
    }

    try {
      await User.deleteOne({ _id: user._id });
      await Vote.deleteMany({ _user_id: user._id });
    } catch (e) {
      Sentry.captureException(e);
      return next(createError(406, "User couldn't be deleted!"));
    }

    res.send({
      success: true,
    });
  }
);

module.exports = router;
