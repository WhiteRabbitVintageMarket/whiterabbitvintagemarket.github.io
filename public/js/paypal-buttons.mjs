import {
  getCartLocalStorage,
  updateCartEventName,
  setCartLocalStorage,
} from "/js/shopping-cart-local-storage.mjs";

import { shoppingCartRenderEventName } from "/js/shopping-cart.mjs";

class PayPalButtons extends HTMLElement {
  constructor() {
    super();
    this.buttonReference = null;
  }

  async createOrder() {
    const { products } = getCartLocalStorage();
    const data = products.map(({ id, quantity }) => {
      return { sku: id, quantity };
    });

    const response = await fetch(
      "https://white-rabbit-server.fly.dev/api/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart: data }),
      },
    );

    const orderData = await response.json();

    return orderData.id;
  }

  async onApprove({ orderID }) {
    const response = await fetch(
      "https://white-rabbit-server.fly.dev/api/capture-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: orderID }),
      },
    );

    const orderData = await response.json();
    setCartLocalStorage({ products: [] });

    window.location.href = "/order-complete/";

    // return orderData;
  }

  render() {
    const { products } = getCartLocalStorage();
    if (products.length === 0) {
      return;
    }

    this.buttonReference = window.paypal.Buttons({
      createOrder: this.createOrder,
      onApprove: this.onApprove,
    });

    this.buttonReference.render(this);
  }

  close() {
    if (this.buttonReference) {
      this.buttonReference.close();
      this.buttonReference = null;
    }
  }

  connectedCallback() {
    window.addEventListener(shoppingCartRenderEventName, () => {
      if (this.buttonReference) {
        return;
      }
      this.render();
    });

    window.addEventListener(updateCartEventName, ({ detail }) => {
      const { products } = detail.shoppingCart;
      if (products.length === 0) {
        this.close();
      }
    });
  }
}

window.customElements.define("paypal-buttons", PayPalButtons);
