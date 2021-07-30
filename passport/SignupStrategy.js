const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

const SignupStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await User.create({ email, password });

      return done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

module.exports = SignupStrategy;
