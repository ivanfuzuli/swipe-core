const express = require("express"),
  router = express.Router();
const axios = require("axios").default;
const url = require("url");

router.get("/facebook", async function (req, res, next) {
  try {
    const apiUrl = url.format({
      protocol: req.protocol,
      host: req.get("host"),
    });

    const { state, code } = req.query;

    const redirectUrl = `exp://auth?state=${state}&token=345&where=expo-auth-session`;
    const orgRedirectUri = apiUrl + "/auth/facebook";
    const reqUrl = `https://graph.facebook.com/v11.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${orgRedirectUri}&client_secret=${process.env.FB_SECRET}&code=${code}`;
    const token_response = await axios.get(reqUrl);

    const { access_token } = token_response.data;

    const result = await axios.get(
      "https://graph.facebook.com/me?fields=email,name&access_token=" +
        access_token
    );
    console.log(result);
    res.redirect(302, redirectUrl);
  } catch (err) {
    console.log(err);
    res.status(406).send("an error ocurred!");
  }
});

module.exports = router;
