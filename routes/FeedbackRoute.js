const express = require("express"),
  router = express.Router();
const sgMail = require("@sendgrid/mail");
const createError = require("http-errors");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FeedbackRoute = router.post("/feedback", async (req, res, next) => {
  const { email, feedback } = req.body;
  if (!email) {
    const error = createError(403, "E-mail is required.");
    return next(error);
  }

  if (!feedback) {
    const error = createError(403, "Feedback is required.");
    return next(error);
  }

  const msg = {
    to: process.env.FEEDBACK_TO_MAIL, // Change to your recipient
    from: process.env.FROM, // Change to your verified sender
    reply_to: email,
    subject: "Swipewise Feedback",
    text: `email: ${email}\n\nfeedback: \n ${feedback}`,
  };

  try {
    await sgMail.send(msg);
    return res.send({ success: true });
  } catch (e) {
    Sentry.captureException(e);
    throw err;
  }
});

module.exports = FeedbackRoute;
