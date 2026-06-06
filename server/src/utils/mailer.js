import dns from "node:dns";
import nodemailer from "nodemailer";
import { Resend } from "resend";

dns.setDefaultResultOrder("ipv4first");

let smtpTransporter = null;
let resendClient = null;
let lastVerifyError = null;
let activeBackend = null;

function ipv4Lookup(hostname, _options, callback) {
	dns.lookup(hostname, { family: 4, all: false }, callback);
}

function buildSmtpTransporter() {
	const user = process.env.EMAIL_USER;
	const pass = process.env.EMAIL_PASSWORD;
	if (!user || !pass) return null;

	return nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 587,
		secure: false,
		requireTLS: true,
		family: 4,
		lookup: ipv4Lookup,
		auth: {
			user,
			pass: pass.replace(/\s+/g, ""),
		},
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 15_000,
		tls: {
			servername: "smtp.gmail.com",
			minVersion: "TLSv1.2",
		},
	});
}

function getResendClient() {
	if (!process.env.RESEND_API_KEY) return null;
	if (!resendClient) {
		resendClient = new Resend(process.env.RESEND_API_KEY);
	}
	return resendClient;
}

function resolveBackend() {
	if (process.env.RESEND_API_KEY) return "resend";
	if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) return "smtp";
	return null;
}

export function getDefaultFrom() {
	if (process.env.RESEND_FROM) return process.env.RESEND_FROM;
	if (process.env.EMAIL_USER) {
		return `"Midnight Bombers" <${process.env.EMAIL_USER}>`;
	}
	return '"Midnight Bombers" <onboarding@resend.dev>';
}

function normalizeRecipients(value) {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	return [value];
}

async function sendViaResend(message) {
	const resend = getResendClient();
	if (!resend) {
		throw new Error("RESEND_API_KEY is not set");
	}

	const { data, error } = await resend.emails.send({
		from: message.from || getDefaultFrom(),
		to: normalizeRecipients(message.to),
		subject: message.subject,
		html: message.html,
		replyTo: message.replyTo,
	});

	if (error) {
		throw new Error(error.message || "Resend rejected the email");
	}

	return { messageId: data?.id };
}

async function sendViaSmtp(message) {
	if (!smtpTransporter) {
		smtpTransporter = buildSmtpTransporter();
	}
	if (!smtpTransporter) {
		throw new Error("EMAIL_USER / EMAIL_PASSWORD not set");
	}
	return smtpTransporter.sendMail(message);
}

export async function verifyMailer() {
	activeBackend = resolveBackend();

	if (!activeBackend) {
		lastVerifyError = "No email backend configured";
		console.warn(
			"[mailer] No email configured. Set RESEND_API_KEY on Railway (SMTP is blocked on Hobby).",
		);
		return false;
	}

	if (activeBackend === "resend") {
		lastVerifyError = null;
		console.log(
			`[mailer] Using Resend API (from: ${getDefaultFrom()}) — works on Railway Hobby`,
		);
		return true;
	}

	try {
		if (!smtpTransporter) smtpTransporter = buildSmtpTransporter();
		await smtpTransporter.verify();
		lastVerifyError = null;
		console.log(
			`[mailer] SMTP connection OK (smtp.gmail.com:587 as ${process.env.EMAIL_USER})`,
		);
		console.warn(
			"[mailer] Note: Gmail SMTP does not work on Railway Hobby — use RESEND_API_KEY in production.",
		);
		return true;
	} catch (err) {
		lastVerifyError = err.message;
		console.error("[mailer] SMTP verify failed:", err.message);
		if (process.env.RAILWAY_ENVIRONMENT) {
			console.error(
				"[mailer] Railway blocks outbound SMTP on Hobby plans. Add RESEND_API_KEY in Railway Variables.",
			);
		}
		return false;
	}
}

export function getLastVerifyError() {
	return lastVerifyError;
}

export function getActiveBackend() {
	return activeBackend || resolveBackend();
}

export async function sendMail(message) {
	const backend = resolveBackend();
	if (!backend) {
		throw new Error(
			"Email not configured. Set RESEND_API_KEY (Railway) or EMAIL_USER + EMAIL_PASSWORD (local dev).",
		);
	}

	if (backend === "resend") {
		return sendViaResend(message);
	}

	try {
		return await sendViaSmtp(message);
	} catch (err) {
		if (process.env.RAILWAY_ENVIRONMENT && /timeout|ENETUNREACH|ESOCKET/i.test(err.message)) {
			throw new Error(
				"SMTP is blocked on Railway Hobby. Add RESEND_API_KEY in Railway Variables and redeploy.",
			);
		}
		throw err;
	}
}
