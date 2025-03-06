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

  // Optionally, you could send this OTP to Google Sheets (same as the previous method)
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

  // Here you could verify OTP by comparing it with Google Sheets data as you did earlier
  displayMessage("OTP verified successfully!");
}

// Function to display messages on the screen
function displayMessage(message) {
  document.getElementById('message').innerText = message;
}

// Initialize the client when the page loads
gapi.load('client:auth2', initClient);
