const express = require("express"),
  router = express.Router();
const axios = require("axios").default;
const url = require("url");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const User = require("../models/User");

const getToken = async (req, code) => {
  const apiUrl = url.format({
    protocol: req.protocol,
    host: req.get("host"),
  });
  const orgRedirectUri = apiUrl + "/auth/facebook";
  const reqUrl = `https://graph.facebook.com/v11.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${orgRedirectUri}&client_secret=${process.env.FB_SECRET}&code=${code}`;
  const { data } = await axios.get(reqUrl);

  return data.access_token;
};

const getMe = async (token) => {
  const { data } = await axios.get(
    "https://graph.facebook.com/me?fields=email,name&access_token=" + token
  );

  return data;
};

const signAndRedirect = (res, state, id, email) => {
  const body = { sub: id, email: email };
  const token = jwt.sign(body, process.env.JWT_SECRET);

  const redirectUrl = `exp://auth?state=${state}&token=${token}&where=expo-auth-session`;
  return res.redirect(302, redirectUrl);
};

const register = async (res, state, fb_id, email) => {
  const password = nanoid();
  const username = "fb_" + nanoid().substring(0, 8);

  const newUser = new User({ fb_id, email, password, username });
  const { _id } = await newUser.save();

  return signAndRedirect(res, state, _id, email);
};

router.get("/facebook", async function (req, res, next) {
  try {
    const { state, code } = req.query;

    let { id, email } = await getMe(await getToken(req, code));

    let foundFacebook = await User.findOne({ fb_id: id });
    if (foundFacebook) {
      return signAndRedirect(res, state, foundFacebook.id, email);
    }

    // register

    if (email) {
      // facebook provides email
      let foundEmail = await User.findOne({ email });
      if (foundEmail) {
        const message =
          "Your email is already in our database. You can sign-in with your e-mail and password.";
        return res.render("errorMessage", { title: "Error!", message });
      }
      return register(res, state, id, email);
    } else {
      email = "fb_" + nanoid().substring(0, 8) + "@swipewiseapp.com";
      return register(res, state, id, email);
    }
  } catch (err) {
    console.log(err);
    const message = "An unexpected error occured! Please, try again later.";
    res.render("errorMessage", { title: "Error!", message });
  }
});

module.exports = router;
