import { formatPrice, getTemplate, LOADING_STATES } from "/js/utils.mjs";

class OrderComplete extends HTMLElement {
  constructor() {
    super();

    this.order = {};

    this.templates = {
      loadingSpinner: getTemplate("loading-spinner-template"),
      orderSummary: getTemplate("order-summary-template"),
      alertError: getTemplate("alert-error-template"),
      getNewOrderListItem: () => getTemplate("order-list-item-template"),
    };
  }

  static get observedAttributes() {
    return ["loading-state"];
  }

  get loadingState() {
    return this.getAttribute("loading-state");
  }

  set loadingState(value) {
    if (value === LOADING_STATES.INITIAL || value === LOADING_STATES.PENDING) {
      this.showLoadingSpinner();
    } else {
      this.hideLoadingSpinner();
    }
    this.setAttribute("loading-state", value);
  }

  showLoadingSpinner() {
    this.appendChild(this.templates.loadingSpinner);
  }

  hideLoadingSpinner() {
    const loadingSpinner = document.querySelector("#loading-spinner");
    if (loadingSpinner) {
      loadingSpinner.remove();
    }
  }

  async fetchOrder(orderId) {
    try {
      this.loadingState = LOADING_STATES.PENDING;
      const response = await fetch(
        `${window.config.apiBaseUrl}/api/orders?paypal-order-id=${orderId}`,
      );
      const json = await response.json();
      this.order = json;
      if (this.order.paypal_order_id) {
        this.loadingState = LOADING_STATES.RESOLVED;
      } else {
        throw new Error("Failed to load order");
      }
    } catch (err) {
      this.loadingState = LOADING_STATES.REJECTED;
    }
  }

  async connectedCallback() {
    const { search } = new URL(window.location.href);
    const params = new URLSearchParams(search);
    const paypalOrderId = params.get("paypal-order-id");

    if (paypalOrderId) {
      await this.fetchOrder(paypalOrderId);
    } else {
      this.renderErrorMessage("Failed to load order.");
    }
  }

  attributeChangedCallback(name) {
    if (name !== "loading-state") {
      return;
    }

    // wait for products to finish loading before rendering
    if (this.loadingState === LOADING_STATES.RESOLVED) {
      this.render();
    } else if (this.loadingState === LOADING_STATES.REJECTED) {
      this.renderErrorMessage("Failed to load order.");
    }
  }

  render() {
    this.innerHTML = "";

    const orderSummary = this.templates.orderSummary;

    const {
      payer_given_name: givenName,
      gross_amount: grossAmount,
      line_items: lineItems,
    } = this.order;

    orderSummary.querySelector('slot[name="payer-first-name"]').innerText =
      givenName;
    orderSummary.querySelector('slot[name="grand-total"]').innerText =
      formatPrice(grossAmount);
    orderSummary.querySelector('slot[name="item-label"]').innerText =
      lineItems.data.length > 1 ? "items" : "item";

    const unorderedList = document.createElement("ul");
    unorderedList.id = "product-list";

    for (const { sku, image_url: imageUrl, name } of lineItems.data) {
      this.renderProduct({
        container: unorderedList,
        sku,
        imageUrl,
        name,
      });
    }

    this.appendChild(orderSummary);
    this.appendChild(unorderedList);
  }

  renderProduct({ sku, imageUrl, name, container }) {
    const listItem = this.templates.getNewOrderListItem();

    const imageElement = listItem.querySelector(
      'slot[name="product-image"] img',
    );
    imageElement.src = imageUrl;
    imageElement.alt = name;

    const productNameHyperlink = listItem.querySelector(
      'slot[name="product-name"] a',
    );
    productNameHyperlink.href = `/shop/?product-id=${sku}`;
    productNameHyperlink.innerText = name;

    container.appendChild(listItem);
  }

  renderErrorMessage(message) {
    this.templates.alertError.querySelector(
      'slot[name="error-message"]',
    ).innerText = message;
    this.append(this.templates.alertError);
  }
}

window.customElements.define("order-complete", OrderComplete);
