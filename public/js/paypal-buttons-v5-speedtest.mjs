class PayPalStandaloneButtonsV5 extends HTMLElement {
  constructor() {
    super();
    this.paypalButtonReference = null;
    this.venmoButtonReference = null;
    this.paypalRenderComplete = false;
    this.venmoRenderComplete = false;
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
    this.renderPayPalButton();
    this.renderVenmoButton();
  }

  renderPayPalButton() {
    const paypalButtonContainer = document.createElement("div");
    paypalButtonContainer.classList.add("w-full", "mb-2");
    this.appendChild(paypalButtonContainer);

    this.buttonReference = window.paypal.Buttons({
      fundingSource: "paypal",
      style: {
        label: "pay",
      },
      createOrder: this.createOrder.bind(this),
      onApprove: this.onApprove.bind(this),
    });

    this.buttonReference.render(paypalButtonContainer).then(() => {
      this.paypalRenderComplete = true;
      this.renderCompleteMessage();
    });
  }

  renderVenmoButton() {
    const venmoButtonContainer = document.createElement("div");
    venmoButtonContainer.classList.add("w-full");
    this.appendChild(venmoButtonContainer);

    this.buttonReference = window.paypal.Buttons({
      fundingSource: "venmo",
      style: {
        label: "pay",
      },
      createOrder: this.createOrder.bind(this),
      onApprove: this.onApprove.bind(this),
    });

    this.buttonReference.render(venmoButtonContainer).then(() => {
      this.venmoRenderComplete = true;
      this.renderCompleteMessage();
    });
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

  renderCompleteMessage() {
    if (this.paypalRenderComplete && this.venmoRenderComplete) {
      const message = document.createElement("p");
      message.classList.add("text-2xl", "mt-5");
      message.innerText = "Loading complete!";
      // half a second delay to account for button label animation
      setTimeout(() => {
        this.append(message);
      }, 500);
    }
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
  "paypal-standalone-buttons-v5",
  PayPalStandaloneButtonsV5,
);
