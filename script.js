
/* =========================
   SOLE — STORE SETTINGS
   Edit products and prices here.
========================= */

const PRODUCTS = [
  {
    id: 1,
    brand: "Nike",
    name: "Air Force 1",
    price: 119.99,
    category: "Nike",
    tag: "Bestseller",
    image:'images/nikelowblack.jpg'
  },
  {
    id: 2,
    brand: "Adidas",
    name: "Samba OG",
    price: 109.99,
    category: "Adidas",
    tag: "Popular",
    image:'images/samba.jpg'
  },
  {
    id: 3,
    brand: "asics",
    name: "574 Core",
    price: 99.99,
    category: "New Balance",
    tag: "new",
    image: 'images/asics.jpg'
  },
  {
    id: 4,
    brand: "Nike",
    name: "Jordan TR",
    price: 139.99,
    category: "Nike",
    tag: "New",
    image:"images/nikelowTRwhite.jpg"
  }

];

/* =========================
   STATE
========================= */

const $ = (selector) => document.querySelector(selector);

const productGrid = $("#product-grid");
const searchInput = $("#search-input");
const filters = $("#filters");
const sortSelect = $("#sort-select");
const resultsCount = $("#results-count");

const cartDrawer = $("#cart-drawer");
const cartItems = $("#cart-items");
const cartCount = $("#cart-count");
const cartTitleCount = $("#cart-title-count");
const cartTotal = $("#cart-total");
const overlay = $("#overlay");
const toast = $("#toast");
const checkoutButton = $("#checkout-button");

let activeCategory = "All";
let searchQuery = "";
let toastTimeout;

let cart = loadCart();

/* =========================
   HELPERS
========================= */

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(price);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("sole-cart"));

    if (!Array.isArray(saved)) return [];

    return saved
      .filter((item) =>
        item &&
        Number.isInteger(item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        PRODUCTS.some((product) => product.id === item.id)
      )
      .map((item) => ({
        id: item.id,
        quantity: Math.min(item.quantity, 99)
      }));
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem("sole-cart", JSON.stringify(cart));
  } catch {
    showToast("Cart cannot be saved in this browser.");
  }
}

function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* =========================
   PRODUCT CATALOG
========================= */

function getVisibleProducts() {
  let products = PRODUCTS.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const searchText =
      `${product.name} ${product.brand} ${product.category}`.toLowerCase();

    const matchesSearch = searchText.includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  switch (sortSelect.value) {
    case "price-low":
      products.sort((a, b) => a.price - b.price);
      break;

    case "price-high":
      products.sort((a, b) => b.price - a.price);
      break;

    case "name":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return products;
}

function renderProducts() {
  const products = getVisibleProducts();

  resultsCount.textContent =
    `${products.length} ${products.length === 1 ? "product" : "products"}`;

  if (products.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <h3>No sneakers found.</h3>
        <p>Try a different search or category.</p>
        <button class="button button-light" id="reset-search">
          Show all products
        </button>
      </div>
    `;

    $("#reset-search").addEventListener("click", resetFilters);
    return;
  }

  productGrid.innerHTML = products.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img
          class="product-image"
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.brand + " " + product.name)}"
          loading="lazy"
          decoding="async"
        >
        ${product.tag ? `
          <span class="product-tag">${escapeHTML(product.tag)}</span>
        ` : ""}
      </div>

      <div class="product-info">
        <p class="product-brand">${escapeHTML(product.brand)}</p>
        <h3 class="product-name">${escapeHTML(product.name)}</h3>

        <div class="product-bottom">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button
            class="add-button"
            data-add="${product.id}"
            aria-label="Add ${escapeHTML(product.name)} to cart"
          >+ Add</button>
        </div>
      </div>
    </article>
  `).join("");
}

/* =========================
   SEARCH & FILTERS
========================= */

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  renderProducts();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) return;

  activeCategory = button.dataset.category;

  filters.querySelectorAll(".filter").forEach((filter) => {
    const isActive = filter === button;
    filter.classList.toggle("active", isActive);
    filter.setAttribute("aria-pressed", String(isActive));
  });

  renderProducts();
});

sortSelect.addEventListener("change", renderProducts);

function resetFilters() {
  activeCategory = "All";
  searchQuery = "";
  searchInput.value = "";
  sortSelect.value = "featured";

  filters.querySelectorAll(".filter").forEach((button) => {
    const isActive = button.dataset.category === "All";
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderProducts();
}

/* =========================
   SHOPPING CART
========================= */

function addToCart(id) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) return;

  const existing = cart.find((item) => item.id === id);

  if (existing) {
    if (existing.quantity >= 99) {
      showToast("Maximum quantity reached.");
      return;
    }

    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} added to your bag.`);
}

function changeQuantity(id, change) {
  const item = cart.find((product) => product.id === id);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter((product) => product.id !== id);
  } else if (item.quantity > 99) {
    item.quantity = 99;
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce((sum, item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  cartCount.textContent = totalQuantity;
  cartTitleCount.textContent = `(${totalQuantity})`;
  cartTotal.textContent = formatPrice(totalPrice);
  checkoutButton.disabled = totalQuantity === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <p>Your bag is empty.</p>
        <p style="margin-top: 8px">Find something you love.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) return "";

    return `
      <article class="cart-item">
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
        >

        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${formatPrice(product.price)}</p>

          <div class="quantity-controls">
            <button
              data-quantity="${product.id}"
              data-change="-1"
              aria-label="Decrease quantity"
            >−</button>

            <span>${item.quantity}</span>

            <button
              data-quantity="${product.id}"
              data-change="1"
              aria-label="Increase quantity"
              ${item.quantity >= 99 ? "disabled" : ""}
            >+</button>
          </div>
        </div>

        <button
          class="remove-button"
          data-remove="${product.id}"
          aria-label="Remove ${escapeHTML(product.name)}"
        >Remove</button>
      </article>
    `;
  }).join("");
}

/* Use event delegation for product buttons. */

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  addToCart(Number(button.dataset.add));
});

cartItems.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    changeQuantity(
      Number(quantityButton.dataset.quantity),
      Number(quantityButton.dataset.change)
    );
  }

  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.remove));
  }
});

/* =========================
   CART DRAWER
========================= */

let previouslyFocusedElement = null;

function openCart() {
  previouslyFocusedElement = document.activeElement;

  cartDrawer.classList.add("open");
  overlay.classList.add("visible");
  document.body.classList.add("cart-open");

  cartDrawer.setAttribute("aria-hidden", "false");
  cartDrawer.inert = false;

  $("#close-cart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("visible");
  document.body.classList.remove("cart-open");

  cartDrawer.setAttribute("aria-hidden", "true");
  cartDrawer.inert = true;

  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}

$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) {
    closeCart();
  }
});



checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) return;

  showToast("Demo store: connect a checkout service to accept orders.");
});



$("#year").textContent = new Date().getFullYear();

filters.querySelectorAll(".filter").forEach((button) => {
  button.setAttribute(
    "aria-pressed",
    String(button.dataset.category === "All")
  );
});

renderProducts();
renderCart();
