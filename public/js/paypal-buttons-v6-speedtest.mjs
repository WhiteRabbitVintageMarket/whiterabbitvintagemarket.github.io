class PayPalStandaloneButtonsV6 extends HTMLElement {
  constructor() {
    super();
    this.paypalOneTimePaymentSession = null;
    this.paypalButtonReference = null;

    this.venmoOneTimePaymentSession = null;
    this.venmoButtonReference = null;
  }

  getBrowserSafeClientToken() {
    const { search } = new URL(window.location.href);
    const params = new URLSearchParams(search);
    return params.get("client-token") || "";
  }

  async createOrder() {
    try {
      const { products } = { products: [{ id: "RMJ00001", quantity: 1 }] };
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

  async onApprove({ orderId }) {
    try {
      const response = await fetch(
        `${window.config.apiBaseUrl}/api/shopping-cart/complete-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: orderId }),
        },
      );

      const orderData = await response.json();

      const errorDetail = orderData?.details?.[0];

      if (orderData.id && orderData.status === "COMPLETED") {
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

  async onPayPalClick() {
    const orderIdPromise = this.createOrder().then((id) => {
      return { orderId: id };
    });

    const params = new URLSearchParams(window.location.search);
    const usePaymentHandler = params.get("payment-handler");
    const presentationMode =
      usePaymentHandler === "true" ? "payment-handler" : "auto";

    try {
      await this.paypalOneTimePaymentSession.start(
        { presentationMode },
        orderIdPromise,
      );
    } catch (error) {
      console.error(error);
    }
  }

  async onVenmoClick() {
    const orderIdPromise = this.createOrder().then((id) => {
      return { orderId: id };
    });
    try {
      await this.venmoOneTimePaymentSession.start(
        { presentationMode: "auto" },
        orderIdPromise,
      );
    } catch (error) {
      console.error(error);
    }
  }

  async onLoad() {
    const clientToken = this.getBrowserSafeClientToken();
    const sdkInstance = await window.paypal.createInstance({
      clientToken,
      components: ["paypal-payments", "venmo-payments"],
    });

    this.paypalOneTimePaymentSession =
      sdkInstance.createPayPalOneTimePaymentSession({
        onApprove: this.onApprove.bind(this),
      });

    this.renderPayPalButton();

    this.venmoOneTimePaymentSession =
      sdkInstance.createVenmoOneTimePaymentSession({
        onApprove: this.onApprove.bind(this),
      });

    this.renderVenmoButton();
  }

  renderPayPalButton() {
    const paypalButton = document.createElement("paypal-button");
    paypalButton.type = "pay";
    paypalButton.classList.add("w-full", "mb-3.5");
    paypalButton.onclick = this.onPayPalClick.bind(this);

    this.appendChild(paypalButton);
    this.paypalButtonReference = document.querySelector("paypal-button");
  }

  renderVenmoButton() {
    const venmoButton = document.createElement("venmo-button");
    venmoButton.type = "pay";
    venmoButton.classList.add("w-full");
    venmoButton.onclick = this.onVenmoClick.bind(this);

    this.appendChild(venmoButton);
    this.venmoButtonReference = document.querySelector("venmo-button");
  }

  close() {
    if (this.paypalButtonReference) {
      this.paypalButtonReference.remove();
      this.paypalButtonReference = null;
    }

    if (this.venmoButtonReference) {
      this.venmoButtonReference.remove();
      this.venmoButtonReference = null;
    }
  }

  connectedCallback() {
    this.onLoad();
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
  "paypal-standalone-buttons-v6",
  PayPalStandaloneButtonsV6,
);
