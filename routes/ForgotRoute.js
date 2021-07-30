const express = require("express"),
  router = express.Router();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const send = () => {
  const msg = {
    to: "can.kucukyilmaz@hotmail.com", // Change to your recipient
    from: process.env.FROM, // Change to your verified sender
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
};

router.post("/", async function (req, res, next) {
  const { email } = req.body;
  let message;

  if (!validateEmail(email)) {
    message = "E-mail is not valid.";
  }

  if (!email) {
    message = "E-mail should not be empty.";
  }

  message = message || "success";

  res.render("forgot", { title: "Forgot Password!", message });
});

router.get("/", function (req, res) {
  res.render("forgot", { title: "Forgot Password!" });
});

module.exports = router;
