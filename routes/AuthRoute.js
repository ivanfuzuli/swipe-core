const express = require("express"),
  router = express.Router();
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const Sentry = require("@sentry/node");

const User = require("../models/User");

const getTokenByFacebook = async (req, code) => {
  const orgRedirectUri = process.env.API_URL + "/auth/facebook";
  const reqUrl = `https://graph.facebook.com/v11.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${orgRedirectUri}&client_secret=${process.env.FB_SECRET}&code=${code}`;
  const { data } = await axios.get(reqUrl);

  return data.access_token;
};

const getMeByFacebook = async (token) => {
  const { data } = await axios.get(
    "https://graph.facebook.com/me?fields=email,name&access_token=" + token
  );

  return data;
};

const getMeByGoogle = async (token) => {
  const { data } = await axios.get(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
  );

  return {
    id: data.sub,
    email: data.email,
  };
};

const getTokenByGoogle = async (req, code) => {
  const orgRedirectUri = process.env.API_URL + "/auth/google";
  const reqUrl = `https://oauth2.googleapis.com/token`;
  const payload = {
    code,
    client_id: process.env.GOOGLE_APP_ID,
    client_secret: process.env.GOOGLE_SECRET,
    redirect_uri: orgRedirectUri,
    grant_type: "authorization_code",
  };

  const { data } = await axios.post(reqUrl, payload);

  return data.access_token;
};

const signAndRedirect = (res, state, id, email, hasTags) => {
  const body = { sub: id, email: email };
  const token = jwt.sign(body, process.env.JWT_SECRET);

  const redirectUrl = `${process.env.REDIRECT_DEEP_LINK}://auth?state=${state}&token=${token}&hasTags=${hasTags}&where=expo-auth-session`;
  return res.redirect(302, redirectUrl);
};

const register = async (res, prefix, idField, state, id, email) => {
  const password = nanoid();
  const username = prefix + nanoid().substring(0, 8);

  const newUser = new User({ [idField]: id, email, password, username });
  const { _id } = await newUser.save();

  return signAndRedirect(res, state, _id, email, 0);
};

router.get("/facebook", async function (req, res, next) {
  try {
    const { state, code } = req.query;

    let { id, email } = await getMeByFacebook(
      await getTokenByFacebook(req, code)
    );

    let foundFacebook = await User.findOne({ fb_id: id });
    if (foundFacebook) {
      const exists = foundFacebook.tags.length > 0;

      let hasTags = 0;
      if (exists) {
        hasTags = 1;
      }

      return signAndRedirect(
        res,
        state,
        foundFacebook._id,
        foundFacebook.email,
        hasTags
      );
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
      return register(res, "fb_", "fb_id", state, id, email);
    } else {
      email = "fb_" + nanoid().substring(0, 8) + "@swipewiseapp.com";
      return register(res, "fb_", "fb_id", state, id, email);
    }
  } catch (e) {
    Sentry.captureException(e);
    const message = "An unexpected error occured! Please, try again later.";
    res.render("errorMessage", { title: "Error!", message });
  }
});

router.get("/google", async function (req, res, next) {
  try {
    const { state, code } = req.query;
    let { id, email } = await getMeByGoogle(await getTokenByGoogle(req, code));

    let foundGoogle = await User.findOne({ go_id: id });
    if (foundGoogle) {
      const exists = foundGoogle.tags.length > 0;

      let hasTags = 0;
      if (exists) {
        hasTags = 1;
      }

      return signAndRedirect(
        res,
        state,
        foundGoogle._id,
        foundGoogle.email,
        hasTags
      );
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
      return register(res, "go_", "go_id", state, id, email);
    } else {
      email = "go_" + nanoid().substring(0, 8) + "@swipewiseapp.com";
      return register(res, "go_", "go_id", state, id, email);
    }
  } catch (e) {
    Sentry.captureException(e);
    const message = "An unexpected error occured! Please, try again later.";
    res.render("errorMessage", { title: "Error!", message });
  }
});
module.exports = router;
