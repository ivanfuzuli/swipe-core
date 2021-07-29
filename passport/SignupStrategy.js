const LocalStrategy = require("passport-local").Strategy;
const UserModel = require("../schema/User");

const SignupStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await UserModel.create({ email, password });

      return done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

module.exports = SignupStrategy;
