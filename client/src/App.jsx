import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Account from "./pages/Account.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";

export default function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route index element={<Home />} />
				<Route path="shop" element={<Shop />} />
				<Route path="product/:id" element={<ProductPage />} />
				<Route path="cart" element={<Cart />} />
				<Route path="login" element={<Login />} />
				<Route path="register" element={<Register />} />
				<Route path="account" element={<Account />} />
				<Route path="about" element={<About />} />
				<Route path="contact" element={<Contact />} />
			</Route>

			<Route
				path="admin"
				element={
					<RequireAdmin>
						<AdminLayout />
					</RequireAdmin>
				}
			>
				<Route index element={<AdminOverview />} />
				<Route path="products" element={<AdminProducts />} />
				<Route path="inventory" element={<AdminInventory />} />
				<Route path="orders" element={<AdminOrders />} />
				<Route path="users" element={<AdminUsers />} />
			</Route>
		</Routes>
	);
}
