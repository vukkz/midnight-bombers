import express from "express";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

router.post("/send", async (req, res) => {
	try {
		const { name, email, subject, message } = req.body;

		if (!name || !email || !message) {
			return res.status(400).json({
				success: false,
				message: "Name, email, and message are required",
			});
		}

		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
			console.error("[contact] EMAIL_USER / EMAIL_PASSWORD not set");
			return res.status(500).json({
				success: false,
				message: "Email service is not configured on the server",
			});
		}

		const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;

		await sendMail({
			from: `"${name}" <${process.env.EMAIL_USER}>`,
			to: ownerEmail,
			replyTo: email,
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
				<p style="color: #666; font-size: 12px;">Reply to respond directly to ${email}</p>
			`,
		});

		try {
			await sendMail({
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
		} catch (err) {
			console.warn("[contact] customer confirmation failed:", err.message);
		}

		res.status(200).json({
			success: true,
			message: "Email sent successfully!",
		});
	} catch (error) {
		console.error("[contact] send failed:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to send email",
			code: error.code,
		});
	}
});

export default router;
