const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

const LoginStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return done(null, false, { message: "user_not_found" });
      }

      const validate = await user.isValidPassword(password);

      if (!validate) {
        return done(null, false, { message: "wrong_password" });
      }

      return done(null, user, { message: "success" });
    } catch (error) {
      return done(error);
    }
  }
);

module.exports = LoginStrategy;
