const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }
  try {
    await resend.emails.send({
      from: 'craftworkssite@resend.dev',
      to: process.env.SUPPORT_EMAIL || 'craftworkssite@gmail.com',
      subject: `Contact Form Submission from ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br>${message}</p>`
    });
    res.json({ message: 'Email sent successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});

module.exports = router; 