/**
 * Copy all shop data from local MongoDB to Atlas (preserves ObjectId, Date, etc.).
 *
 * Usage: npm run migrate:atlas -w server
 *
 * Requires server/.env with MONGODB_URI pointing at Atlas.
 * Optional: LOCAL_MONGODB_URI (defaults to mongodb://127.0.0.1:27017/midnight-bombers)
 */

import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

dns.setDefaultResultOrder("ipv4first");

const LOCAL_URI =
	process.env.LOCAL_MONGODB_URI ||
	"mongodb://127.0.0.1:27017/midnight-bombers";
const ATLAS_URI = process.env.ATLAS_MONGODB_URI || process.env.MONGODB_URI;
const DB_NAME = "midnight-bombers";

const COLLECTIONS = ["products", "users", "orders", "newsletters"];

function ensureDbInUri(uri) {
	if (uri.match(/\.mongodb\.net\/[^/?]+/)) return uri;
	return uri.replace(/\.mongodb\.net\/?(\?|$)/, `.mongodb.net/${DB_NAME}$1`);
}

function parseSrvCredentials(uri) {
	const m = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)/);
	if (!m) return null;
	return { user: m[1], pass: m[2], host: m[3] };
}

async function tryDirectHost(user, pass, host) {
	const uri =
		`mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}` +
		`@${host}:27017/${DB_NAME}?ssl=true&directConnection=true&authSource=admin`;
	const conn = await mongoose.createConnection(uri, {
		serverSelectionTimeoutMS: 15000,
	}).asPromise();
	await conn.db.collection("_migrate_ping").insertOne({ t: new Date() });
	await conn.db.collection("_migrate_ping").deleteMany({});
	return conn;
}

async function connectAtlas(uri) {
	const withDb = ensureDbInUri(uri);

	try {
		return await mongoose.createConnection(withDb, {
			serverSelectionTimeoutMS: 20000,
		}).asPromise();
	} catch (err) {
		if (!withDb.startsWith("mongodb+srv://")) throw err;
	}

	console.warn("SRV connection failed — trying direct Atlas hosts…");
	const creds = parseSrvCredentials(withDb);
	if (!creds) throw new Error("Could not parse Atlas connection string");

	let hosts = [];
	try {
		const records = await dns.promises.resolveSrv(`_mongodb._tcp.${creds.host}`);
		hosts = records.map((r) => r.name);
	} catch {
		console.warn("DNS SRV lookup failed — using shard hostnames from cluster");
		const suffix = creds.host.replace("cluster0.", "");
		hosts = [0, 1, 2].map(
			(n) => `ac-gexwj4e-shard-00-0${n}.${suffix}`,
		);
	}

	for (const host of hosts) {
		try {
			const conn = await tryDirectHost(creds.user, creds.pass, host);
			console.log(`Connected via ${host}`);
			return conn;
		} catch {
			// try next host until primary is found
		}
	}

	throw new Error(
		"Could not connect to Atlas. Check MONGODB_URI, Network Access, and credentials.",
	);
}

async function migrate() {
	if (!ATLAS_URI) {
		console.error("Set MONGODB_URI in server/.env to your Atlas connection string.");
		process.exit(1);
	}
	if (ATLAS_URI.includes("127.0.0.1") || ATLAS_URI.includes("localhost")) {
		console.error("MONGODB_URI still points to localhost — use your Atlas mongodb+srv:// string.");
		process.exit(1);
	}

	console.log("Local:", LOCAL_URI);
	console.log("Atlas:", ATLAS_URI.replace(/\/\/.*@/, "//***@"));
	console.log("");

	const local = await mongoose.createConnection(LOCAL_URI).asPromise();
	const atlas = await connectAtlas(ATLAS_URI);
	console.log("Connected to both databases.\n");

	for (const name of COLLECTIONS) {
		const docs = await local.db.collection(name).find({}).toArray();
		console.log(`${name}: ${docs.length} document(s) on local`);
		if (docs.length === 0) continue;

		const deleted = await atlas.db.collection(name).deleteMany({});
		await atlas.db.collection(name).insertMany(docs);
		console.log(`  -> replaced ${deleted.deletedCount} on Atlas, inserted ${docs.length}`);
	}

	await local.close();
	await atlas.close();
	console.log("\nMigration complete (BSON types preserved).");
}

migrate().catch((err) => {
	console.error("\nMigration failed:", err.message);
	process.exit(1);
});
