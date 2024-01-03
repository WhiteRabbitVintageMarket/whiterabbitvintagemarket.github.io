const localStorageKey = "shoppingCart";

export function addProductToCart(productId) {
  if (isProductInCart(productId)) {
    return;
  }

  const { products } = getCartLocalStorage();
  // hard-coding quantity since every product has a quantity of 1
  products.push({ id: productId, quantity: 1 });
  setCartLocalStorage({ products });
}

export function isProductInCart(productId) {
  const { products } = getCartLocalStorage();
  const result = products.find(({ id }) => id === productId);
  return Boolean(result);
}

export function removeProductFromCart(productId) {
  const { products } = getCartLocalStorage();

  const productsToKeep = products.filter((product) => {
    return product.id !== productId;
  });

  setCartLocalStorage({ products: productsToKeep });
}

export function getCartLocalStorage() {
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

export const updateCartEventName = "updateCart";

export function setCartLocalStorage(shoppingCart) {
  try {
    window.localStorage.setItem(localStorageKey, JSON.stringify(shoppingCart));
    const eventUpdateCart = new CustomEvent(updateCartEventName, {
      detail: { shoppingCart },
    });

    window.dispatchEvent(eventUpdateCart);
  } catch (error) {
    console.error("Failed to write shopping cart to local storage", error);
  }
}
