import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "host8.registrar-servers.com",
  host: "smtp.mail.me.com",
  port: 587,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

export const sendEmail = async (email, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: subject,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(error);
  }
};

export const registrationEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Registration Verification Email",
      html: `
      <div>
          <h1>Registration Verification</h1>
          <p>Click the link below to register yourself</p>
          <a href=${link} clicktracking=off>Complete Registration.</a>
      </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email.", error);
  }
};

export const passwordResetEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Email",
      text: `
        <div>
          <h1>Reset Email</h1>
          <p>Click the link below to verify and reset the password yourself</p>
          <a href=${link} clicktracking=off></a>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email.", error);
  }
};

// Transporter verification function.
// const verifyTransporter = transporter.verify((error, success) => {
//   try {
//     if (success) {
//       console.log("🚀 ~ Transporter Verified and Ready to Send Emails!");
//     } else {
//       console.error("🚀 ~ Transporter Verification Error:", error);
//     }
//   } catch (error) {
//     console.error("🚀 ~ Error verifying transporter: ", error);
//     return error;
//   }
// });
