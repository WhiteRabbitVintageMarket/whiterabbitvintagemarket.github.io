import {
  getCartLocalStorage,
  updateCartEventName,
  setCartLocalStorage,
} from "/js/shopping-cart-local-storage.mjs";

import { shoppingCartRenderEventName } from "/js/shopping-cart.mjs";

class PayPalStandaloneButton extends HTMLElement {
  constructor() {
    super();
    this.paypalCheckoutSession = null;
    this.buttonReference = null;
  }

  async getBrowserSafeClientToken() {
    const response = await fetch(
      `${window.config.apiBaseUrl}/api/browser-safe-client-token`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const { browser_safe_access_token } = await response.json();
    return browser_safe_access_token;
  }

  async createOrder() {
    try {
      const { products } = getCartLocalStorage();
      const data = products.map(({ id, quantity }) => {
        return { sku: id, quantity };
      });

      const response = await fetch(
        `${window.config.apiBaseUrl}/api/shopping-cart/begin-checkout`,
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
        `${window.config.apiBaseUrl}/api/shopping-cart/complete-checkout`,
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

  onShippingAddressChange(data) {
    const countryCode = data?.shippingAddress?.countryCode ?? "US";

    if (countryCode === "US") {
      return Promise.resolve();
    } else {
      return Promise.reject(data?.errors?.COUNTRY_ERROR);
    }
  }

  async onClick() {
    const orderIdPromise = this.createOrder().then((id) => {
      return { orderId: id };
    });
    try {
      await this.paypalCheckoutSession.start(
        { paymentFlow: "auto" },
        orderIdPromise,
      );
    } catch (error) {
      console.error(error);
    }
  }

  async onLoad() {
    const { products } = getCartLocalStorage();
    if (products.length === 0) {
      return;
    }

    const clientToken = await this.getBrowserSafeClientToken();
    const sdkInstance = await window.paypal.createInstance({ clientToken });
    this.paypalCheckoutSession = sdkInstance.paypal.createCheckout({
      onApprove: this.onApprove.bind(this),
      onShippingAddressChange: this.onShippingAddressChange.bind(this),
    });

    const paypalButton = document.createElement("paypal-button");
    paypalButton.classList.add("w-full");
    paypalButton.onclick = this.onClick.bind(this);
    this.appendChild(paypalButton);
    this.buttonReference = document.querySelector("paypal-button");
  }

  close() {
    if (this.buttonReference) {
      this.buttonReference.remove();
      this.buttonReference = null;
    }
  }

  connectedCallback() {
    window.addEventListener(shoppingCartRenderEventName, () => {
      if (this.buttonReference) {
        return;
      }
      this.onLoad();
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
      "alert-paypal-buttons-error-template",
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

window.customElements.define(
  "paypal-standalone-button",
  PayPalStandaloneButton,
);
