const url = require("url");

const express = require("express"),
  router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const sendMail = async (email, apiUrl) => {
  let foundUser = await User.findOne({ email });
  if (!foundUser) {
    throw Error("not_exists");
  }

  const body = { sub: foundUser._id, email: foundUser.email };
  const token = jwt.sign(body, process.env.JWT_SECRET, {
    expiresIn: "6h",
  });

  const link = apiUrl + "/forgot/verify/" + token;
  const msg = {
    to: email, // Change to your recipient
    from: process.env.FROM, // Change to your verified sender
    subject: "Swipewise password reset link.",
    text: "You can reset your password via this link. " + link,
    html: [
      "You can reset your password via this link. <a href=" +
        link +
        ">" +
        link +
        "</a>",
    ].join(""),
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    throw err;
  }
};

router.post("/", async function (req, res, next) {
  const { email } = req.body;
  const apiUrl = url.format({
    protocol: req.protocol,
    host: req.get("host"),
  });

  let message;

  if (!validateEmail(email)) {
    message = "E-mail is not valid.";
  }

  if (!email) {
    message = "E-mail should not be empty.";
  }

  try {
    await sendMail(email, apiUrl);
  } catch (err) {
    if (err.message === "not_exists") {
      message = "User not exists...";
    } else {
      message = "E-mail have not been sent.";
    }
  }

  message = message || "success";

  res.render("forgot", { title: "Forgot Password!", message });
});

router.get("/", function (req, res) {
  res.render("forgot", { title: "Forgot Password!" });
});

router.get("/verify/:token", function (req, res) {
  const token = req.params.token;
  res.render("verify", { title: "Change Password!", token });
});

router.post("/verify/:token", async function (req, res) {
  const token = req.params.token;
  const { password, repassword } = req.body;
  let decoded;
  let result;
  try {
    result = jwt.verify(token, process.env.JWT_SECRET);
    decoded = true;
  } catch (e) {
    decoded = false;
  }
  console.log(result);

  let message;
  let blockmessage;
  if (!decoded) {
    blockmessage = "Token is expired!";
  }

  if (!password) {
    message = "New Password field required.";
  }

  if (password.length < 4) {
    message = "New Password must be least 4 character.";
  }

  if (password !== repassword) {
    message = "New Password and confirm doesn't match.";
  }

  if (!message && !blockmessage) {
    try {
      const user = await User.findOne({ _id: result.sub });
      if (user) {
        user.password = password;
        await user.save();
      }
    } catch (err) {
      console.log(err);
    }

    message = "success";
  }

  res.render("verify", {
    title: "Change Password!",
    message,
    token,
    blockmessage,
  });
});

module.exports = router;
