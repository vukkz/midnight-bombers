import nodemailer from "nodemailer";

let cached = null;
let lastVerifyError = null;

function buildTransporter() {
	const user = process.env.EMAIL_USER;
	const pass = process.env.EMAIL_PASSWORD;

	if (!user || !pass) {
		return null;
	}

	return nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user,
			pass: pass.replace(/\s+/g, ""),
		},
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 15_000,
		pool: true,
		maxConnections: 3,
		maxMessages: 50,
	});
}

export function getMailer() {
	if (cached) return cached;
	cached = buildTransporter();
	return cached;
}

export async function verifyMailer() {
	const mailer = getMailer();
	if (!mailer) {
		lastVerifyError = "EMAIL_USER / EMAIL_PASSWORD not set";
		console.warn(`[mailer] ${lastVerifyError}`);
		return false;
	}
	try {
		await mailer.verify();
		lastVerifyError = null;
		console.log(`[mailer] SMTP connection OK (smtp.gmail.com:465 as ${process.env.EMAIL_USER})`);
		return true;
	} catch (err) {
		lastVerifyError = err.message;
		console.error("[mailer] SMTP verify failed:", err.message);
		console.error(
			"[mailer] Most likely cause: EMAIL_PASSWORD must be a 16-character Gmail App Password",
		);
		console.error("[mailer] Generate one at https://myaccount.google.com/apppasswords");
		return false;
	}
}

export function getLastVerifyError() {
	return lastVerifyError;
}

export async function sendMail(message) {
	const mailer = getMailer();
	if (!mailer) {
		throw new Error("Email service not configured (EMAIL_USER / EMAIL_PASSWORD missing)");
	}
	return mailer.sendMail(message);
}
