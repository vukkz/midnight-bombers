import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Send contact form email
router.post("/send", async (req, res) => {
	try {
		const { name, email, subject, message } = req.body;

		// Validate required fields
		if (!name || !email || !message) {
			return res.status(400).json({
				success: false,
				message: "Name, email, and message are required",
			});
		}

		// Create transporter with Gmail
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		});

		// Email to business owner (shows it's from customer)
		await transporter.sendMail({
			from: `"${name}" <${process.env.EMAIL_USER}>`, // Shows customer name but comes from your Gmail
			to: process.env.OWNER_EMAIL,
			replyTo: email, // When you reply, it goes to customer
			subject: `New Contact: ${subject || "No Subject"}`,
			html: `
				<h2>New Contact Form Message</h2>
				<p><strong>From:</strong> ${name}</p>
				<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
				<p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
				<hr>
				<p><strong>Message:</strong></p>
				<p>${message.replace(/\n/g, "<br>")}</p>
				<hr>
				<p style="color: #666; font-size: 12px;">⬆️ Click Reply to respond directly to ${email}</p>
			`,
		});

		// Confirmation email to customer
		await transporter.sendMail({
			from: `"Midnight Bombers" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: "We received your message - Midnight Bombers",
			html: `
				<h2>Thank you for contacting us!</h2>
				<p>Hi ${name},</p>
				<p>We have received your message and will get back to you as soon as possible.</p>
				<p><strong>Your message:</strong></p>
				<p>${message.replace(/\n/g, "<br>")}</p>
				<hr>
				<p>Best regards,<br>Midnight Bombers Team</p>
			`,
		});

		res.status(200).json({
			success: true,
			message: "Email sent successfully!",
		});
	} catch (error) {
		console.error("Email error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to send email",
			error: error.message,
		});
	}
});

export default router;
