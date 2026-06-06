import dns from "dns";
import mongoose from "mongoose";

const DB_NAME = "midnight-bombers";

dns.setDefaultResultOrder("ipv4first");

export function ensureDbName(uri) {
	if (/\.mongodb\.net\/[^/?]+/.test(uri) || /:\d+\/[^/?]+/.test(uri)) {
		return uri;
	}
	return uri.replace(
		/(\.mongodb\.net)\/?(\?|$)/,
		`$1/${DB_NAME}$2`,
	).replace(
		/(mongodb:\/\/[^/]+)\/?(\?|$)/,
		`$1/${DB_NAME}$2`,
	);
}

function parseSrvCredentials(uri) {
	const m = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)/);
	if (!m) return null;
	return { user: decodeURIComponent(m[1]), pass: decodeURIComponent(m[2]), host: m[3] };
}

async function tryDirectHost(user, pass, host) {
	const uri =
		`mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}` +
		`@${host}:27017/${DB_NAME}?ssl=true&directConnection=true&authSource=admin`;
	const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
	await conn.connection.db.collection("_connect_ping").insertOne({ t: new Date() });
	await conn.connection.db.collection("_connect_ping").deleteMany({});
	return conn;
}

async function connectWithSrvFallback(uri) {
	try {
		return await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
	} catch (err) {
		if (!uri.startsWith("mongodb+srv://") || err.code !== "ECONNREFUSED") {
			throw err;
		}
	}

	console.warn("MongoDB SRV lookup failed — trying direct Atlas hosts…");
	const creds = parseSrvCredentials(uri);
	if (!creds) {
		throw new Error("Could not parse MongoDB Atlas connection string");
	}

	let hosts = [];
	try {
		const records = await dns.promises.resolveSrv(`_mongodb._tcp.${creds.host}`);
		hosts = records.map((r) => r.name);
	} catch {
		const suffix = creds.host.replace(/^cluster\d+\./, "");
		hosts = [0, 1, 2].map((n) => `ac-gexwj4e-shard-00-0${n}.${suffix}`);
	}

	for (const host of hosts) {
		try {
			const conn = await tryDirectHost(creds.user, creds.pass, host);
			console.log(`MongoDB connected via ${host}`);
			return conn;
		} catch {
			// try next host
		}
	}

	throw new Error(
		"Could not connect to MongoDB Atlas. Check MONGODB_URI, Network Access (0.0.0.0/0), and credentials.",
	);
}

export async function connectDB() {
	const raw = process.env.MONGODB_URI;
	if (!raw) {
		throw new Error(
			"MONGODB_URI is not set. Add it to Railway Variables or server/.env for local dev.",
		);
	}

	const uri = ensureDbName(raw);
	if (uri !== raw) {
		console.warn(`MONGODB_URI had no database name — using "${DB_NAME}"`);
	}

	mongoose.set("strictQuery", true);
	await connectWithSrvFallback(uri);
	console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}
