const express = require("express"),
  router = express.Router();
const User = require("../schema/User");
const jwt = require("jsonwebtoken");

const RegisterRoute = router.post("/register", async function (req, res, next) {
  const { email, password, username } = req.body;
  if (!email) {
    return res.status(403).json({ error: "email_required" });
  }
  if (!username) {
    return res.status(403).json({ error: "username_required" });
  }
  if (!password) {
    return res.status(403).json({ error: "password_required" });
  }

  //Check If User Exists
  let foundUser = await User.findOne({ email });
  if (foundUser) {
    return res.status(403).json({ error: "Email is already in use" });
  }

  let foundUsername = await User.findOne({ username });
  if (foundUsername) {
    return res.status(403).json({ error: "Username is already in use" });
  }

  const newUser = new User({ email, password, username });
  await newUser.save(); // Generate JWT token
  const body = { sub: newUser._id, email: newUser.email };
  const token = jwt.sign({ user: body }, process.env.JWT_SECRET);
  res.status(201).json({ token });
});

module.exports = RegisterRoute;
