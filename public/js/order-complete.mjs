import { formatPrice } from "/js/money.mjs";

class OrderComplete extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ["loading", "order"];
  }

  get loading() {
    return JSON.parse(this.getAttribute("loading"));
  }

  set loading(value) {
    value === true ? this.showLoadingSpinner() : this.hideLoadingSpinner();
    this.setAttribute("loading", JSON.stringify(value));
  }

  get order() {
    return JSON.parse(this.getAttribute("order"));
  }

  set order(value) {
    this.setAttribute("order", JSON.stringify(value));
  }

  showLoadingSpinner() {
    const shoppingCartLoadingSpinnerTemplate = document.getElementById(
      "loading-spinner-template",
    ).content;
    const loadingSpinner = shoppingCartLoadingSpinnerTemplate.cloneNode(true);
    this.appendChild(loadingSpinner);
  }

  hideLoadingSpinner() {
    const loadingSpinner = document.querySelector("#loading-spinner");
    if (loadingSpinner) {
      loadingSpinner.remove();
    }
  }

  async fetchOrder(orderId) {
    this.loading = true;

    const response = await fetch(
      `https://white-rabbit-server.fly.dev/api/orders?paypal-order-id=${orderId}`,
    );
    const json = await response.json();
    this.order = json;
    this.loading = false;
  }

  async connectedCallback() {
    const { search } = new URL(window.location.href);
    const params = new URLSearchParams(search);
    const paypalOrderId = params.get("paypal-order-id");

    if (paypalOrderId) {
      await this.fetchOrder(paypalOrderId);
    } else {
      this.order = {};
    }
  }

  attributeChangedCallback(name) {
    if (name === "order") {
      this.render();
    }
  }

  render() {
    this.innerHTML = "";

    if (!this.order.paypal_order_id) {
      return;
    }

    const orderSummaryTemplate = document.getElementById(
      "order-summary-template",
    ).content;
    const orderSummary = orderSummaryTemplate.cloneNode(true);

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
    const orderListItemTemplate = document.getElementById(
      "order-list-item-template",
    ).content;
    const listItem = orderListItemTemplate.cloneNode(true);

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
}

window.customElements.define("order-complete", OrderComplete);
