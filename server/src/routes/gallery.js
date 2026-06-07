import { Router } from "express";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { getActiveBackend, getDefaultFrom, sendMail } from "../utils/mailer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "../../uploads/gallery");
mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, cb) => cb(null, uploadsDir),
		filename: (_req, file, cb) => {
			const ext = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] || ".jpg";
			const safe = file.originalname
				.replace(/\.[a-zA-Z0-9]+$/, "")
				.replace(/[^a-zA-Z0-9-_]/g, "-")
				.slice(0, 40);
			cb(null, `${Date.now()}-${safe}${ext.toLowerCase()}`);
		},
	}),
	limits: { fileSize: 8 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) cb(null, true);
		else cb(new Error("Only image files are allowed"));
	},
});

const router = Router();

function resolvePublicUrl(req) {
	const configured = process.env.CLIENT_URL?.trim();
	if (configured && !configured.includes("localhost")) {
		return /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
	}
	if (process.env.RAILWAY_PUBLIC_DOMAIN) {
		return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
	}
	const origin = req.get("origin") || req.get("referer");
	if (origin) {
		try {
			return new URL(origin).origin;
		} catch {
			// ignore
		}
	}
	return "http://localhost:5173";
}

router.post("/submit", upload.single("photo"), async (req, res) => {
	try {
		const { name, instagramHandle, email, caption } = req.body;

		if (!name?.trim()) {
			return res.status(400).json({ message: "Name is required" });
		}

		if (!req.file) {
			return res.status(400).json({ message: "Photo is required" });
		}

		if (!getActiveBackend()) {
			return res.status(500).json({ message: "Email service is not configured on the server" });
		}

		const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;
		if (!ownerEmail) {
			return res.status(500).json({ message: "OWNER_EMAIL is not configured on the server" });
		}

		const baseUrl = resolvePublicUrl(req).replace(/\/$/, "");
		const photoUrl = `${baseUrl}/uploads/gallery/${req.file.filename}`;
		const ig = instagramHandle?.trim() ? instagramHandle.trim().replace(/^@/, "") : null;

		const ownerHtml = `
			<h2>New Street Gallery submission</h2>
			<p><strong>Name:</strong> ${name.trim()}</p>
			${ig ? `<p><strong>Instagram:</strong> @${ig}</p>` : ""}
			${email?.trim() ? `<p><strong>Email:</strong> ${email.trim()}</p>` : ""}
			${caption?.trim() ? `<p><strong>Caption / location:</strong><br>${caption.trim().replace(/\n/g, "<br>")}</p>` : ""}
			<p><strong>Photo:</strong> <a href="${photoUrl}">${photoUrl}</a></p>
			<p><img src="${photoUrl}" alt="Gallery submission" style="max-width:100%;border-radius:8px;margin-top:12px;" /></p>
		`;

		await sendMail({
			from: getDefaultFrom(),
			to: ownerEmail,
			replyTo: email?.trim() || undefined,
			subject: `Gallery submission from ${name.trim()}${ig ? ` (@${ig})` : ""}`,
			html: ownerHtml,
		});

		if (email?.trim()) {
			try {
				await sendMail({
					from: getDefaultFrom(),
					to: email.trim(),
					subject: "We received your photo — Midnight Bombers",
					html: `
						<h2>Thanks for sharing your work!</h2>
						<p>Hi ${name.trim()},</p>
						<p>We received your gallery submission and will review it soon. If it fits the #NotForToyz vibe, we may feature it on our homepage or Instagram.</p>
						<p>Keep painting,<br>Midnight Bombers</p>
					`,
				});
			} catch (err) {
				console.warn("[gallery] submitter confirmation failed:", err.message);
			}
		}

		res.json({ success: true, message: "Photo submitted successfully!" });
	} catch (err) {
		console.error("[gallery] submit failed:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to submit photo",
		});
	}
});

export default router;
