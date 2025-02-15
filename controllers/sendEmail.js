const nodemailer = require("nodemailer");
require("dotenv").config();

const sendMail = async (userEmail, subject, message) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false, // Bypass SSL certificate validation
            },
        });        

        const mailOptions = {
            from: `"Free_APIs4_Students_by_Dhruv" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
                    <h2 style="color: #2c3e50;">${subject}</h2>
                    <p>${message}</p>
                    <hr>
                    <p style="font-size: 12px; color: #7f8c8d;">This is an automated email. Please do not reply.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${userEmail}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = sendMail;