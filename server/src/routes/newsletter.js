import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Newsletter } from "../models/Newsletter.js";
import { emailTemplates } from "../utils/emailTemplates.js";

const router = express.Router();

// Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
	try {
		const { email } = req.body;

		// Validate email
		if (!email) {
			return res.status(400).json({
				success: false,
				message: "Email is required",
			});
		}

		// Check if already subscribed
		const existing = await Newsletter.findOne({ email });
		if (existing && existing.subscribed) {
			return res.status(400).json({
				success: false,
				message: "This email is already subscribed",
			});
		}

		// If previously unsubscribed, resubscribe
		if (existing && !existing.subscribed) {
			existing.subscribed = true;
			existing.unsubscribeToken = undefined;
			await existing.save();
		} else {
			// Create new subscription
			const unsubscribeToken = crypto.randomBytes(32).toString("hex");
			await Newsletter.create({
				email,
				subscribed: true,
				unsubscribeToken,
			});
		}

		// Create transporter inside the handler
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		});

		// Send welcome email
		const template = emailTemplates.welcome;
		await transporter.sendMail({
			from: `"Midnight Bombers" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: template.subject,
			html: template.getHtml(email),
		});

		res.status(200).json({
			success: true,
			message: "Successfully subscribed! Check your email for confirmation.",
		});
	} catch (error) {
		console.error("Newsletter subscribe error:", error);

		// Handle duplicate email error
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "This email is already subscribed",
			});
		}

		res.status(500).json({
			success: false,
			message: "Failed to subscribe",
			error: error.message,
		});
	}
});

// Unsubscribe from newsletter
router.get("/unsubscribe", async (req, res) => {
	try {
		const { email } = req.query;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: "Email is required",
			});
		}

		const subscriber = await Newsletter.findOne({ email });

		if (!subscriber) {
			return res.status(404).json({
				success: false,
				message: "Email not found",
			});
		}

		// Mark as unsubscribed
		subscriber.subscribed = false;
		await subscriber.save();

		res.status(200).json({
			success: true,
			message: "You have been unsubscribed from our newsletter",
		});
	} catch (error) {
		console.error("Newsletter unsubscribe error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to unsubscribe",
		});
	}
});

// Get all subscribers (for sending bulk newsletters later)
router.get("/subscribers", async (req, res) => {
	try {
		const subscribers = await Newsletter.find({ subscribed: true });
		res.status(200).json({
			success: true,
			count: subscribers.length,
			subscribers: subscribers.map((s) => s.email),
		});
	} catch (error) {
		console.error("Error fetching subscribers:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch subscribers",
		});
	}
});

export default router;
