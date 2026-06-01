import { products } from "./products.js";

const bar = document.getElementById("bar");
const close = document.getElementById("close");
const nav = document.getElementById("navbar");

if (bar) {
	bar.addEventListener("click", () => {
		nav.classList.add("active");
	});
}

if (close) {
	close.addEventListener("click", () => {
		nav.classList.remove("active");
	});
}

// nav toggle
// const navToggle = document.querySelector('.nav-toggle');
// const navLinks = document.querySelectorAll('.nav__link')

// navToggle.addEventListener('click', () => {
//     document.body.classList.toggle('nav-open');
// });

// navLinks.forEach(link => {
//     link.addEventListener('click', () => {
//         document.body.classList.remove('nav-open');
//     })
// })

// id search
const params = new URLSearchParams(window.location.search);
const productId = parseInt(params.get("id"));

const productNameEl = document.getElementById("product-name");

if (productId && productNameEl) {
	const product = products.find((p) => p.id === Number(productId));

	productNameEl.textContent = product.name;
	document.getElementById("product-image").src = product.image;
	document.getElementById("product-description").textContent =
		product.description;
	document.getElementById("product-price").textContent = product.price + " RSD";

	if (!product) {
		document.body.innerHTML = "<h2>Product not found</h2>";
		throw new Error("Product not found");
	}
}

// PAGINATION FOR SHOP PAGE --------------------------------------
const shopGrid = document.querySelector(".pro-container");

if (shopGrid) {
	const productsPerPage = 8;
	let currentPage = 1;

	function renderProducts(page) {
		currentPage = page;

		const start = (page - 1) * productsPerPage;
		const end = start + productsPerPage;
		const pageProducts = products.slice(start, end);

		shopGrid.innerHTML = "";

		pageProducts.forEach((product) => {
			shopGrid.innerHTML += `
        <div class="pro">
          <a href="product.html?id=${product.id}">
            <img src="${product.image}">
            <div class="des">
              <span>${product.category || "spray paint"}</span>
              <h5>${product.name}</h5>
			  <div class="star">
			  	<i class="fas fa-star"></i>
			  	<i class="fas fa-star"></i>
			  	<i class="fas fa-star"></i>
			  	<i class="fas fa-star"></i>
			  	<i class="fas fa-star"></i>
			  </div>
              <h4>${product.price} RSD</h4>
			</div>
				<i class="fa-solid fa-cart-shopping cart"></i>
			</div>
            </div>
          </a>
        </div>
      `;
		});
	}

	// First page on load
	renderProducts(1);

	// Pagination click
	const paginationLinks = document.querySelectorAll("#pagination a");
	paginationLinks.forEach((link) => {
		link.addEventListener("click", function (e) {
			e.preventDefault();

			console.log("Clicked:", this.dataset.page);

			const pageValue = this.dataset.page;

			if (pageValue === "next") {
				const totalPages = Math.ceil(products.length / productsPerPage);
				if (currentPage < totalPages) {
					currentPage++;
				}
			} else {
				currentPage = parseInt(pageValue);
			}

			renderProducts(currentPage);
		});
	});
}
