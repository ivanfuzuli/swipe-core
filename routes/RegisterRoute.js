const express = require("express"),
  router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const RegisterRoute = router.post("/register", async function (req, res, next) {
  const { email, password, username } = req.body;
  if (!email) {
    return next(createError(403, "E-mail is required!"));
  }
  if (!username) {
    return next(createError(403, "Username is required!"));
  }
  if (!password) {
    return next(createError(403, "Password is required!"));
  }

  //Check If User Exists
  let foundUser = await User.findOne({ email });
  if (foundUser) {
    return next(createError(403, "E-mail already exists."));
  }

  let foundUsername = await User.findOne({ username });
  if (foundUsername) {
    return next(createError(403, "Username already exists."));
  }

  try {
    const newUser = new User({ email, password, username });
    await newUser.save(); // Generate JWT token
    const body = { sub: newUser._id, email: newUser.email };
    const token = jwt.sign(body, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch {
    return next(
      createError(
        403,
        "We cannot register your account. Please try again later."
      )
    );
  }
});

module.exports = RegisterRoute;
