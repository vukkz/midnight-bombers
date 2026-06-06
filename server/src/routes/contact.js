import express from "express";
import { getActiveBackend, getDefaultFrom, sendMail } from "../utils/mailer.js";

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

		if (!getActiveBackend()) {
			console.error("[contact] no email backend configured");
			return res.status(500).json({
				success: false,
				message: "Email service is not configured on the server",
			});
		}

		const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;
		if (!ownerEmail) {
			return res.status(500).json({
				success: false,
				message: "OWNER_EMAIL is not configured on the server",
			});
		}

		const from = getDefaultFrom();

		await sendMail({
			from,
			to: ownerEmail,
			replyTo: email,
			subject: `New Contact from ${name}: ${subject || "No Subject"}`,
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
				from,
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
		let message = error.message || "Failed to send email";
		if (message.includes("only send testing emails")) {
			message =
				"Resend testing mode: onboarding@resend.dev can only send to your Resend signup email. " +
				"Set OWNER_EMAIL to that same address for testing, or verify midnightbombers.com in Resend " +
				"and set RESEND_FROM to e.g. Midnight Bombers <noreply@midnightbombers.com>.";
		}
		res.status(500).json({
			success: false,
			message,
			code: error.code,
		});
	}
});

export default router;
