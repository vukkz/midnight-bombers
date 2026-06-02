import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

export default function AdminUsers() {
	const { user: currentUser } = useAuth();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get("/api/admin/users");
			setUsers(data.users);
			setError("");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const isSelf = (id) => String(id) === String(currentUser?.id);

	const changeRole = async (userId, role) => {
		setBusyId(userId);
		try {
			await api.patch(`/api/admin/users/${userId}/role`, { role });
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setBusyId(null);
		}
	};

	const deleteUser = async (userId, name) => {
		if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
		setBusyId(userId);
		try {
			await api.delete(`/api/admin/users/${userId}`);
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<>
			<h1 className="admin-page-title">Users</h1>
			{error && <p className="form-error">{error}</p>}
			{loading ? (
				<LoadingSpinner message="Loading users..." />
			) : (
				<div className="admin-panel">
					<div className="admin-table-wrap">
						<table className="admin-table admin-table--stack">
							<thead>
								<tr>
									<th>Name</th>
									<th>Email</th>
									<th>Role</th>
									<th>Joined</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => {
									const self = isSelf(u._id);
									return (
										<tr key={u._id}>
											<td data-label="Name">
												{u.name}
												{self && (
													<>
														{" "}
														<small>(you)</small>
													</>
												)}
											</td>
											<td data-label="Email">{u.email}</td>
											<td data-label="Role">
												<select
													className="admin-select status-select"
													value={u.role}
													disabled={self || busyId === u._id}
													onChange={(e) => changeRole(u._id, e.target.value)}
												>
													<option value="customer">customer</option>
													<option value="admin">admin</option>
												</select>
											</td>
											<td data-label="Joined">{new Date(u.createdAt).toLocaleDateString()}</td>
											<td data-label="Actions">
												<button
													type="button"
													className="admin-btn sm danger"
													disabled={self || busyId === u._id}
													onClick={() => deleteUser(u._id, u.name)}
												>
													Delete
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	);
}
