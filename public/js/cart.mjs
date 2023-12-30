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
