/* eslint-disable max-len */
const express = require("express");
const {
  google,
} = require("googleapis");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const app = express();
app.use(bodyParser.json());

const spreadsheetId = "1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98";

// Load Google API credentials
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, "credentials.json")));

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/gmail.send"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

// Create a reusable transporter object using SMTP transport
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dcsposoptionform@gmail.com",
    pass: "dtmrhbvtdayslsss",
  },
});

/**
 * Sends an OTP to the provided email address.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */


app.post("/sendOTP", async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP
    const timestamp = moment.tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");

    const request = {
      spreadsheetId,
      range: "OTPs!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [
          [email, otp, timestamp],
        ],
      },
    };

    await sheets.spreadsheets.values.append(request);

    // Send email with OTP
    await mailer.sendMail({
      from: "dcsposoptionform@gmail.com",
      to: "dcsposoptionform@gmail.com",
      subject: email,
      text: `Your OTP code is ${otp}. It is valid for 15 minutes.`,
    });

    res.json({
      message: "OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message: "Error sending OTP.",
      error: error.message,
    });
  }
});

/**
 * Verifies the OTP for the provided email address.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */
app.post("/verifyOTP", async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    const request = {
      spreadsheetId,
      range: "OTPs!A:C",
    };

    // Fetch all the OTPs data
    const response = await sheets.spreadsheets.values.get(request);
    const rows = response.data.values;

    let isValid = false;
    let rowIndex = -1;
    let otpTimestamp = null;

    // Find the latest OTP for the given email
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === email && rows[i][1] === otp) {
        otpTimestamp = rows[i][2];
        rowIndex = i;
        isValid = true;
        break;
      }
    }

    if (isValid && otpTimestamp) {
      const otpTime = moment.tz(otpTimestamp, "Asia/Singapore").toDate();
      const currentTime = moment.tz("Asia/Singapore").toDate();

      // Check if OTP is within 15 minutes
      if ((currentTime - otpTime) / (1000 * 60) <= 15) {
        // OTP is valid, so remove it and move the email to the verified list
        rows.splice(rowIndex, 1);

        // Update the Google Sheets with the remaining OTPs
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `OTPs!A1:C${rows.length}`,
          valueInputOption: "RAW",
          resource: {
            values: rows,
          },
        });

        // Add email to the "VerifiedEmails" sheet
        await addVerifiedEmail(email);

        res.json({
          message: "OTP verified successfully.",
        });
      } else {
        res.json({
          message: "OTP has expired.",
        });
      }
    } else {
      res.json({
        message: "Invalid OTP.",
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      message: "Error verifying OTP.",
      error: error.message,
    });
  }
});
/**
 * Adds the provided email address to the "VerifiedEmails" sheet with a timestamp.
 *
 * @param {string} email - The email address to be added to the verified emails list.
 * @return {Promise<void>} - Does not return a value, but logs an error if the operation fails.
 */
async function addVerifiedEmail(email) {
  const verifiedEmailsSheetName = "VerifiedEmails";
  const timestamp = moment.tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");

  const request = {
    spreadsheetId,
    range: `${verifiedEmailsSheetName}!A:B`,
    valueInputOption: "RAW",
    resource: {
      values: [
        [email, timestamp],
      ],
    },
  };

  try {
    await sheets.spreadsheets.values.append(request);
  } catch (error) {
    console.error("Error adding verified email:", error);
  }
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
