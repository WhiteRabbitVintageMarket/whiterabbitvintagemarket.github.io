import { formatPrice, calculateTotal } from "/js/money.mjs";

const localStorageKey = "shoppingCart";

export function updateCartProductCount() {
  const navCartProductCount = document.querySelector("#nav-cart-product-count");
  if (navCartProductCount) {
    const { products } = getCartLocalStorage();
    navCartProductCount.innerHTML = products.length;
  }
}

export function addProductToCart(product) {
  if (isProductInCart(product)) {
    return;
  }

  const { products } = getCartLocalStorage();
  products.push(product);
  setCartLocalStorage({ products });
  updateCartProductCount();
}

export function isProductInCart(productId) {
  const { products } = getCartLocalStorage();
  const result = products.find(({ id }) => id === productId);
  return Boolean(result);
}

function removeProductFromCart(productId) {
  const { products } = getCartLocalStorage();

  const productsToKeep = products.filter((product) => {
    return product.id !== productId;
  });

  setCartLocalStorage({ products: productsToKeep });
  updateCartProductCount();
}

export function displayCart({ allProducts, container }) {
  const productList = document.querySelector("#product-list");
  const cartSummary = document.querySelector("#cart-summary");

  if (productList) {
    productList.remove();
  }

  if (cartSummary) {
    cartSummary.remove();
  }

  const { products: cartProducts } = getCartLocalStorage();

  if (cartProducts.length === 0) {
    return container.querySelector("#empty-cart").classList.remove("hidden");
  }

  const selectedProducts = allProducts.filter((product) => {
    const result = cartProducts.find(({ id }) => id === product.id);
    return Boolean(result);
  });

  const unorderedList = document.createElement("ul");
  unorderedList.id = "product-list";

  for (const selectedProduct of selectedProducts) {
    const { removeProductButton } = displayProduct({
      product: selectedProduct,
      container: unorderedList,
    });
    removeProductButton.onclick = (event) => {
      removeProductFromCart(selectedProduct.id);
      displayCart({ allProducts, container });
    };
  }

  container.appendChild(unorderedList);

  const summaryRow = document.createElement("div");
  summaryRow.id = "cart-summary";
  summaryRow.classList.add("flex", "justify-between", "sm:justify-end", "ml-4");

  const label = document.createElement("p");
  label.classList.add("sm:mr-32");
  label.innerText = "Subtotal";

  const amount = document.createElement("p");
  const subTotal = calculateTotal(selectedProducts);
  amount.innerText = formatPrice(subTotal);

  summaryRow.appendChild(label);
  summaryRow.appendChild(amount);

  container.appendChild(summaryRow);
}

function displayProduct({ product, container }) {
  const listItem = document.createElement("li");
  listItem.id = `product-${product.id}`;
  listItem.classList.add(
    "flex",
    "flex-wrap",
    "justify-start",
    "items-start",
    "min-h-32",
    "my-4",
    "pb-4",
    "border-b",
    "border-stone-300",
  );

  const productImage = document.createElement("img");
  productImage.classList.add(
    "w-32",
    "object-cover",
    "aspect-square",
    "bg-stone-300",
    "mr-4",
  );
  productImage.src = product.url;

  const productName = document.createElement("p");
  productName.innerText = product.name;
  productName.classList.add("grow", "basis-1/5");

  const productPrice = document.createElement("div");
  productPrice.classList.add(
    "w-full",
    "sm:w-40",
    "order-2",
    "sm:order-none",
    "flex",
    "justify-end",
    "ml-4",
  );
  productPrice.innerText = formatPrice(product.price);

  const removeProductButton = document.createElement("button");
  removeProductButton.classList.add("ml-6");
  removeProductButton.innerHTML = `
    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18">
      <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
    </svg>`;

  listItem.appendChild(productImage);
  listItem.appendChild(productName);
  listItem.appendChild(productPrice);
  listItem.appendChild(removeProductButton);

  container.appendChild(listItem);

  return {
    removeProductButton,
  };
}

function getCartLocalStorage() {
  const defaultCartValue = { products: [] };
  try {
    const data = window.localStorage.getItem(localStorageKey);
    if (data) {
      return JSON.parse(data);
    } else {
      return defaultCartValue;
    }
  } catch (error) {
    console.error("Failed to read shopping cart from local storage", error);
  }
}

function setCartLocalStorage(shoppingCart) {
  try {
    window.localStorage.setItem(localStorageKey, JSON.stringify(shoppingCart));
  } catch (error) {
    console.error("Failed to write shopping cart to local storage", error);
  }
}
