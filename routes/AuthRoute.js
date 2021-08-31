const express = require("express"),
  router = express.Router();
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const Sentry = require("@sentry/node");
const createError = require("http-errors");
const { OAuth2Client } = require("google-auth-library");

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

const getCrendialsByApple = async (authorizationCode) => {
  const { data } = await axios.post(
    "https://appleid.apple.com/auth/token",
    new URLSearchParams({
      code: authorizationCode,
      client_id: process.env.APPLE_APP_ID,
      client_secret: process.env.APPLE_SECRET,
      grant_type: "authorization_code",
      redirect_uri: process.env.APPLE_REDIRECT_URI,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const credentials = jwt.decode(data.id_token);

  return credentials;
};

async function verifyGoogleToken(token, platform) {
  const clientId =
    platform === "ios"
      ? process.env.GOOGLE_APP_ID
      : process.env.GOOGLE_ANDROID_APP_ID;
  const client = new OAuth2Client(clientId);

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId, // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const id = payload["sub"];
  const email = payload["email"];

  return {
    id,
    email,
  };
}

const signAndRedirect = (res, state, id, email, hasTags) => {
  const body = { sub: id, email: email };
  const token = jwt.sign(body, process.env.JWT_SECRET);

  if (state !== false) {
    const redirectUrl = `${process.env.REDIRECT_DEEP_LINK}://auth?state=${state}&token=${token}&hasTags=${hasTags}&where=expo-auth-session`;
    return res.redirect(302, redirectUrl);
  }

  return res.send({
    token,
    hasTags,
  });
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

router.post("/google", async function (req, res, next) {
  try {
    const { token } = req.body;
    const { platform } = req.params;

    let { id, email } = await verifyGoogleToken(token, platform);
    let foundGoogle = await User.findOne({ go_id: id });
    if (foundGoogle) {
      const exists = foundGoogle.tags.length > 0;

      let hasTags = 0;
      if (exists) {
        hasTags = 1;
      }

      return signAndRedirect(
        res,
        false,
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
    next(createError(406, message));
  }
});

router.post("/apple", async function (req, res, next) {
  try {
    const { code } = req.body;

    let { sub, email } = await getCrendialsByApple(code);

    let foundApple = await User.findOne({ apple_id: sub });
    if (foundApple) {
      const exists = foundApple.tags.length > 0;

      let hasTags = 0;
      if (exists) {
        hasTags = 1;
      }

      return signAndRedirect(
        res,
        false,
        foundApple._id,
        foundApple.email,
        hasTags
      );
    }

    // register

    if (email) {
      // apple provides email
      let foundEmail = await User.findOne({ email });
      if (foundEmail) {
        const message =
          "Your email is already in our database. You can sign-in with your e-mail and password.";
        return next(createError(406, message));
      }
      return register(res, "apple_", "apple_id", false, sub, email);
    } else {
      email = "apple_" + nanoid().substring(0, 8) + "@swipewiseapp.com";
      return register(res, "apple_", "apple_id", false, sub, email);
    }
  } catch (e) {
    console.log("e", e);
    Sentry.captureException(e);
    const message = "An unexpected error occured! Please, try again later.";
    return next(createError(406, message));
  }
});
module.exports = router;
