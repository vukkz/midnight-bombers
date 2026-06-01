import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Account from "./pages/Account.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

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
		</Routes>
	);
}
