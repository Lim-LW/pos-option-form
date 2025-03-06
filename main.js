// Your Google API Key and OAuth client ID
const CLIENT_ID = '72180639473-r8t473dmj2qb88s7veov5acc0jc7ujlb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDPZACSSc4bb4Hta_hpyqHVD5FWtzTCLiM';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

// Load the Google API client and initialize OAuth
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
  }).then(() => {
    console.log("Google API client initialized");
  });
}

// Handle OAuth login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn().then(() => {
    console.log("User signed in");
  });
}

// Send OTP function
async function sendOTP() {
  const email = document.getElementById('email').value;
  if (!email) {
    displayMessage("Email is required!");
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP
  const timestamp = new Date().toISOString();

// Append OTP to Google Sheets
  try {
    const request = {
      spreadsheetId: "1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98",  // Replace with your Google Sheet ID
      range: "OTPs!A1", // Specify the range where you want to append
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [
          [email, otp, timestamp], // Append email, OTP, and timestamp to the sheet
        ],
      },
    };

    // Send the OTP to Google Sheets
    await gapi.client.sheets.spreadsheets.values.append(request);
	
	
  // Here we're going to send the email using Gmail API.

  const defemail = "dcsposoptionform@gmail.com";
  const message = `Your OTP code is ${otp}. It is valid for 15 minutes.`;

  // Send email via Gmail API
  //sendEmail(email, subject, message) 
  try {
    const sendRequest = await sendEmail(defemail, email, message);  
    console.log(sendRequest);
    displayMessage(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP:", error);
    displayMessage("Error sending OTP.");
  }
}

// Function to send email using Gmail API
function sendEmail(to, subject, body) {
  const email = [
    "Content-Type: text/plain; charset=UTF-8\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: " + to + "\n",
    "subject: " + subject + "\n\n",
    body
  ].join("");

  const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');  // URL-safe base64

  const request = gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': encodedEmail
    }
  });

  return request;
}
// Verify OTP function
async function verifyOTP() {
  const email = document.getElementById('email').value;
  const otp = document.getElementById('otp').value;

  if (!email || !otp) {
    displayMessage("Email and OTP are required!");
    return;
  }

  try {
    // Fetch OTP data from Google Sheets
    const request = {
      spreadsheetId: "1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98",  // Replace with your Google Sheet ID
      range: "OTPs!A:C",  // The range of columns to check
    };
    const response = await gapi.client.sheets.spreadsheets.values.get(request);
    const rows = response.result.values;

    let isValid = false;
    let rowIndex = -1;
    let otpTimestamp = null;

    // Find the OTP for the provided email
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === email && rows[i][1] === otp) {
        otpTimestamp = rows[i][2];
        rowIndex = i;
        isValid = true;
        break;
      }
    }

    if (isValid && otpTimestamp) {
      const otpTime = new Date(otpTimestamp);
      const currentTime = new Date();

      // Check if OTP is within 15 minutes
      if ((currentTime - otpTime) / (1000 * 60) <= 15) {
        // OTP is valid, so remove it and move the email to VerifiedEmails sheet
        rows.splice(rowIndex, 1);

        // Update the Google Sheets with the remaining OTPs
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: "1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98",  // Replace with your Google Sheet ID
          range: `OTPs!A1:C${rows.length}`,
          valueInputOption: "RAW",
          resource: {
            values: rows,
          },
        });

        // Add email to the VerifiedEmails sheet
        await addVerifiedEmail(email);

        displayMessage("OTP verified successfully!");
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


// Function to add verified email to Google Sheets
async function addVerifiedEmail(email) {
  const timestamp = new Date().toISOString();

  const request = {
    spreadsheetId: "1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98",  // Replace with your Google Sheet ID
    range: "VerifiedEmails!A:B",  // Specify the range where to append the verified email
    valueInputOption: "RAW",
    resource: {
      values: [
        [email, timestamp],  // Add email and timestamp to the sheet
      ],
    },
  };

  try {
    await gapi.client.sheets.spreadsheets.values.append(request);
    console.log(`Email ${email} added to VerifiedEmails sheet`);
  } catch (error) {
    console.error("Error adding verified email:", error);
  }
}

// Function to display messages on the screen
function displayMessage(message) {
  document.getElementById('message').innerText = message;
}

// Initialize the client when the page loads
gapi.load('client:auth2', initClient);
