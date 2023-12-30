import { formatPrice } from "/js/money.mjs";

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

function removeProductFromCart() {}

export function displayCart({ allProducts, container }) {
  const { products: cartProducts } = getCartLocalStorage();
  if (cartProducts.length === 0) {
    return container.querySelector("#empty-cart").classList.remove("hidden");
  }

  const selectedProducts = allProducts.filter((product) => {
    const result = cartProducts.find(({ id }) => id === product.id);
    return Boolean(result);
  });

  const unorderedList = document.createElement("ul");
  for (const selectedProduct of selectedProducts) {
    const listItem = document.createElement("li");
    listItem.classList.add("flex", "justify-start", "h-32", "my-4");

    const productImage = document.createElement("img");
    productImage.classList.add(
      "object-cover",
      "aspect-square",
      "bg-stone-300",
      "mr-4",
    );
    productImage.src = selectedProduct.url;

    const productName = document.createElement("p");
    productName.innerText = selectedProduct.name;
    productName.classList.add("grow");

    const productPrice = document.createElement("div");
    productPrice.innerText = formatPrice(selectedProduct.price);
    productPrice.classList.add("w-40", "flex", "justify-end", "ml-4");

    listItem.appendChild(productImage);
    listItem.appendChild(productName);
    listItem.appendChild(productPrice);

    unorderedList.appendChild(listItem);
  }

  container.appendChild(unorderedList);
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
