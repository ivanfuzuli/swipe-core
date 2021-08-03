require("dotenv").config();
const DB = process.env.DB;
const PORT = process.env.PORT;

const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const User = require("./models/User");

const app = express();
const LoginStrategy = require("./passport/LoginStrategy");

const LoginRoute = require("./routes/LoginRoute");
const ProfileRoute = require("./routes/ProfileRoute");
const RegisterRoute = require("./routes/RegisterRoute");
const ForgotRoute = require("./routes/ForgotRoute");
const VoteRoute = require("./routes/VoteRoute");
const QuoteRoute = require("./routes/QuoteRoute");

mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(
  new JwtStrategy(opts, function (jwt_payload, done) {
    User.findOne({ _id: jwt_payload.sub }, function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
        // or you could create a new account
      }
    });
  })
);

passport.use("login", LoginStrategy);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(LoginRoute);
app.use(RegisterRoute);
app.use(ProfileRoute);
app.use("/forgot", ForgotRoute);
app.use(VoteRoute);
app.use(QuoteRoute);

app.use(function (err, req, res, next) {
  res.status(err.status).send(err);
});
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
