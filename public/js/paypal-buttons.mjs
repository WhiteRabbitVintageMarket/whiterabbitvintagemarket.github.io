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
    try {
      const { products } = getCartLocalStorage();
      const data = products.map(({ id, quantity }) => {
        return { sku: id, quantity };
      });

      const response = await fetch(
        "https://white-rabbit-server.fly.dev/api/shopping-cart/begin-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cart: data }),
        },
      );

      const orderData = await response.json();

      if (orderData.id) {
        return orderData.id;
      } else {
        const errorDetail = orderData?.details?.[0];

        if (errorDetail) {
          throw new Error(
            `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`,
          );
        } else if (orderData.message) {
          throw new Error(orderData.message);
        } else {
          throw new Error(JSON.stringify(orderData));
        }
      }
    } catch (error) {
      this.renderErrorMessage(error);
    }
  }

  async onApprove({ orderID }) {
    try {
      const response = await fetch(
        "https://white-rabbit-server.fly.dev/api/shopping-cart/complete-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: orderID }),
        },
      );

      const orderData = await response.json();

      const errorDetail = orderData?.details?.[0];

      if (orderData.id && orderData.status === "COMPLETED") {
        setCartLocalStorage({ products: [] });
        window.location.href = `/order-complete/?paypal-order-id=${orderData.id}`;
      } else if (errorDetail) {
        throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
      } else if (orderData.message) {
        throw new Error(orderData.message);
      } else {
        throw new Error(JSON.stringify(orderData));
      }
    } catch (error) {
      this.renderErrorMessage(error);
    }
  }

  onShippingAddressChange(data, actions) {
    const countryCode = data?.shippingAddress?.countryCode ?? "US";

    if (countryCode === "US") {
      return Promise.resolve();
    } else {
      return actions.reject(data?.errors?.COUNTRY_ERROR);
    }
  }

  render() {
    const { products } = getCartLocalStorage();
    if (products.length === 0) {
      return;
    }

    this.buttonReference = window.paypal.Buttons({
      createOrder: this.createOrder.bind(this),
      onApprove: this.onApprove.bind(this),
      onShippingAddressChange: this.onShippingAddressChange.bind(this),
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

  renderErrorMessage(message) {
    const alertErrorTemplate = document.getElementById(
      "alert-error-template",
    ).content;
    const alert = alertErrorTemplate.cloneNode(true);

    alert.querySelector('slot[name="error-message"]').innerText = message;

    alert.querySelector("button").onclick = () => {
      const currentAlert = document.querySelector(".alert-error");
      if (currentAlert) {
        currentAlert.remove();
      }
    };

    this.append(alert);
  }
}

window.customElements.define("paypal-buttons", PayPalButtons);
