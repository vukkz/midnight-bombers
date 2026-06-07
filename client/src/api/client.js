const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
	let res;
	try {
		res = await fetch(`${API_BASE}${path}`, {
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});
	} catch {
		throw new Error("Failed to fetch");
	}

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		const detail = data.message || data.error || `HTTP ${res.status}`;
		throw new Error(detail);
	}

	return data;
}

async function uploadRequest(path, formData, method = "POST") {
	let res;
	try {
		res = await fetch(`${API_BASE}${path}`, {
			method,
			credentials: "include",
			body: formData,
		});
	} catch {
		throw new Error("Failed to fetch");
	}

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(data.message || "Upload failed");
	}

	return data;
}

export const api = {
	get: (path) => request(path),
	post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
	put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
	patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
	delete: (path) => request(path, { method: "DELETE" }),
	upload: (path, formData) => uploadRequest(path, formData),
	uploadPatch: (path, formData) => uploadRequest(path, formData, "PATCH"),
};
