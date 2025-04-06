const express = require('express');
const path = require('path');
const session = require("express-session"); 
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const userModel = require("./userModel.js");
const authUtils = require("./authUtils.js");
const fs = require('fs');

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "views")));
const PORT = process.env.PORT ;
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false,
    maxAge: 60 * 60 * 1000, 
   },
}));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/2fa_verification', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', '2fa_verification.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
  }
  if (userModel.findByUsername(username)) {
      return res.status(400).json({ error: 'Username already taken' });
  }
  const user = userModel.add({ 
      username, 
      email, 
      password,
  });
  res.redirect('/login');
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = userModel.findByUsername(username);
  if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
  }
  const otp = authUtils.generateOTP();
  const otpResult = await authUtils.sendOTP(user.email, otp);
  if (!otpResult.success) { 
    console.error('OTP Error:', otpResult.error);
      return res.status(500).json({ error: otpResult.error });
  }
  req.session.loginotp={
    otp,
    email: user.email,
    username: user.username, 
    expires: Date.now() + (30 * 60 * 1000),
    message: 'Please check your email for OTP',
  }
  res.redirect('/2fa_verification');
});
app.post('/verify_2fa', (req, res) => {
  const { code } = req.body;
  const loginOTP = req.session.loginotp;
  if (!loginOTP || Date.now() > loginOTP.expires) {
      return res.status(400).send(`
          <script>
              alert('OTP expired or invalid session');
              window.location.href = '/login';
          </script>
      `);
  }
  if (code !== loginOTP.otp) {
      return res.status(401).send(`
          <script>
              alert('Invalid verification code');
              window.location.href = '/2fa_verification';
          </script>
      `);
  }
  req.session.userId = loginOTP.userId;
  req.session.username = loginOTP.username;
  res.send(`
      <script>
          alert('Login successful!');
          window.location.href = '/dashboard';
      </script>
  `);
});
app.get('/resend', async (req, res) => {
  const loginOTP = req.session.loginotp; 
  if (!loginOTP) {
      return res.redirect('/login');
  }
  const newOTP = authUtils.generateOTP();
  const otpResult = await authUtils.sendOTP(loginOTP.email, newOTP);
  if (!otpResult.success) {
      return res.status(500).send(`
          <script>
              alert('Failed to send new code');
              window.location.href = '/2fa_verification';
          </script>
      `);
  }
  req.session.loginotp = {
      ...loginOTP,
      otp: newOTP,
      expires: Date.now() + (30 * 60 * 1000) 
  };

  res.send(`
      <script>
          alert('New code sent to your email');
          window.location.href = '/2fa_verification';
      </script>
  `);
});
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).send(`
              <script>
                  alert('Error logging out');
                  window.location.href = '/dashboard';
              </script>
          `);
      }
      res.redirect('/');
  });
});
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
}).on("error", (err) => {
  console.error("Error starting server:", err);
});