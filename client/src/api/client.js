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
		throw new Error(data.message || "Request failed");
	}

	return data;
}

export const api = {
	get: (path) => request(path),
	post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
	put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
	delete: (path) => request(path, { method: "DELETE" }),
};
