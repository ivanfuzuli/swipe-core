const express = require("express"),
  router = express.Router();
const sgMail = require("@sendgrid/mail");

const ProfileRoute = router.post("/forgot", async function (req, res, next) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: "can.kucukyilmaz@hotmail.com", // Change to your recipient
    from: "can@swipewiseapp.com", // Change to your verified sender
    subject: "Sending with SendGrid is Fun",
    text: "and easy to do anywhere, even with Node.js",
    html: "<strong>and easy to do anywhere, even with Node.js</strong>",
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
});

module.exports = ProfileRoute;
