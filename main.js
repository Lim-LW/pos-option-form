// Your Google API Key and Spreadsheet ID
const apiKey = 'YOUR_GOOGLE_API_KEY';
const spreadsheetId = '1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98';

// Load the API client and initialize it
function initClient() {
  gapi.client.init({
    apiKey: apiKey,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
  }).then(() => {
    console.log("Google API client initialized");
  });
}

// Load the API client when the page is loaded
gapi.load('client', initClient);

// Function to send OTP and save it in Google Sheets
async function sendOTP() {
  const email = document.getElementById('email').value;
  if (!email) {
    displayMessage("Email is required!");
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP
  const timestamp = new Date().toISOString();

  const request = {
    spreadsheetId: spreadsheetId,
    range: "OTPs!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: [
        [email, otp, timestamp],
      ],
    },
  };

  try {
    const response = await gapi.client.sheets.spreadsheets.values.append(request);
    console.log(response);
    displayMessage(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP:", error);
    displayMessage("Error sending OTP.");
  }
}

// Function to verify OTP by comparing with stored ones in Google Sheets
async function verifyOTP() {
  const email = document.getElementById('email').value;
  const otp = document.getElementById('otp').value;

  if (!email || !otp) {
    displayMessage("Email and OTP are required!");
    return;
  }

  const request = {
    spreadsheetId: spreadsheetId,
    range: "OTPs!A:C",
  };

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get(request);
    const rows = response.result.values;

    let isValid = false;
    let otpTimestamp = null;

    // Find the matching OTP
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === email && rows[i][1] === otp) {
        otpTimestamp = rows[i][2];
        isValid = true;
        break;
      }
    }

    if (isValid && otpTimestamp) {
      const otpTime = new Date(otpTimestamp);
      const currentTime = new Date();

      // Check if OTP is within 15 minutes
      if ((currentTime - otpTime) / (1000 * 60) <= 15) {
        displayMessage("OTP verified successfully!");
        // Optionally, remove the OTP after verification, or add to a "verified" sheet
      } else {
        displayMessage("OTP has expired.");
      }
    } else {
      displayMessage("Invalid OTP.");
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    displayMessage("Error verifying OTP.");
  }
}

// Function to display messages on the screen
function displayMessage(message) {
  document.getElementById('message').innerText = message;
}
