const nodemailer = require("nodemailer");

/**
 * Send an email using Nodemailer.
 * In development/if no real credentials are provided, it falls back to Ethereal Email
 * so you can inspect the sent messages via a generated URL in the console.
 */
const sendEmail = async (options) => {
  let transporter;

  // Use real SMTP if credentials are provided in the environment
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail", // e.g., 'gmail', 'SendGrid'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Fallback: Generate a fake Ethereal account for testing
    console.log("No EMAIL_USER found. Using Ethereal Email for testing...");
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  // Define the email payload
  const message = {
    from: `${process.env.FROM_NAME || "SupplySenseAI"} <${process.env.FROM_EMAIL || "noreply@supplysense.ai"}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // Send the email
  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);

  // If using Ethereal, log the preview URL so the admin can click it to see the email
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
