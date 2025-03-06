const CLIENT_ID = '72180639473-r8t473dmj2qb88s7veov5acc0jc7ujlb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDPZACSSc4bb4Hta_hpyqHVD5FWtzTCLiM';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets';

let generatedOtp = '';  // Store the generated OTP

// Initialize Google API Client
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
            "https://sheets.googleapis.com/$discovery/rest?version=v4"
        ],
    }).then(() => {
        console.log("Google API client initialized");
    }).catch(error => {
        console.error("Error initializing Google API client: ", error);
    });
}

// Initialize the client
gapi.load('client:auth2', initClient);

// Send OTP via Gmail API
function sendOTP() {
    const email = document.getElementById('email').value;
    const sendOtpButton = document.getElementById('sendOtpButton');

    if (!email) {
        alert('Please enter a valid email address.');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    sendOtpButton.disabled = true; // Disable the button after clicking

    // Generate a random OTP
    generatedOtp = Math.floor(100000 + Math.random() * 900000); // Generate OTP

    // Send the OTP via email using Gmail API
    sendEmail(email, "Your OTP Code", `Your OTP code is: ${generatedOtp}`);

    // You can log this to a Google Sheets document as well if needed
    const spreadsheetId = "YOUR_GOOGLE_SHEET_ID";
    const range = "Sheet1!A2";  // The range to append data
    appendDataToSheet(spreadsheetId, range, [[email, generatedOtp]]);

    // Show the OTP section after sending OTP
    document.getElementById('email-section').style.display = 'none';
    document.getElementById('otp-section').style.display = 'block';
    document.getElementById('resendOtpButton').disabled = false; // Enable Resend button
}

// Send email using Gmail API
function sendEmail(to, subject, body) {
    const email = [
        "Content-Type: text/plain; charset=UTF-8\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: " + to + "\n",
        "subject: " + subject + "\n\n",
        body
    ].join("");

    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_'); // URL-safe base64

    const request = gapi.client.gmail.users.messages.send({
        'userId': 'me',
        'resource': {
            'raw': encodedEmail
        }
    });

    request.execute();
}

// Append email and OTP to Google Sheets
function appendDataToSheet(spreadsheetId, range, values) {
    const params = {
        spreadsheetId: "1aT1Cvmpl5lKEVq-fzKcJgLuLNBEd7_EzSYos2A1fp98",
        range: range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS"
    };

    const valueRangeBody = {
        values: values
    };

    const request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
    request.then(response => {
        console.log("Data appended to sheet:", response);
    }).catch(error => {
        console.error("Error appending data to sheet:", error);
    });
}

// Verify OTP function
function verifyOTP() {
    const otp = document.getElementById('otp').value;

    if (!otp) {
        alert('Please enter the OTP.');
        return;
    }

    if (otp === generatedOtp.toString()) {
        alert('OTP Verified!');
        document.getElementById('otp-section').style.display = 'none';
        document.getElementById('form-section').style.display = 'block';
        document.getElementById('form-iframe').src = 'https://docs.google.com/forms/d/e/1FAIpQLSf8rfgMRMJiI2xrjczbjuHugT5NVNfTQ-wbyQ66UVd7xCmCkQ/viewform?embedded=true';
    } else {
        alert('Invalid OTP');
    }
}

// Resend OTP function
function resendOTP() {
    alert('OTP has been resent.');
    sendOTP(); // Resend the OTP by calling sendOTP again
}
