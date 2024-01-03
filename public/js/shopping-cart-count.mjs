import {
  getCartLocalStorage,
  updateCartEventName,
} from "/js/shopping-cart-local-storage.mjs";

class ShoppingCartCount extends HTMLElement {
  constructor() {
    super();
    const { products } = getCartLocalStorage();
    this.cartCount = products.length;
  }

  set cartCount(count) {
    this.innerText = count;
  }

  connectedCallback() {
    window.addEventListener(updateCartEventName, ({ detail }) => {
      const { products } = detail.shoppingCart;
      this.cartCount = products.length;
    });
  }
}

window.customElements.define("shopping-cart-count", ShoppingCartCount);
