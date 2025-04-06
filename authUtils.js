const crypto = require('crypto');
const nodemailer = require('nodemailer');

const authUtils = {
    generateOTP: () => {
        return crypto.randomInt(10, 99).toString();
    },
    sendOTP: async (email, otp) => {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return { success: false, error: 'Email configuration missing' };
        }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Login OTP',
                text: `Your OTP for login is: ${otp}`
            });
            return { success: true };
        } catch (error) {
            console.error('Email error:', error);
            return { success: false, error: 'Failed to send OTP' };
        }
    }
};

module.exports = authUtils;