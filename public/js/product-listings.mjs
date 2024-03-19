const LOADING_STATES = {
  INITIAL: "INITIAL",
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

class ProductListings extends HTMLElement {
  constructor() {
    super();
    this.products = [];
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

  async fetchProducts() {
    try {
      this.loadingState = LOADING_STATES.PENDING;
      const response = await fetch(`${window.config.apiBaseUrl}/api/products`);
      const json = await response.json();
      this.products = json.data;
      if (this.products.length) {
        this.loadingState = LOADING_STATES.RESOLVED;
      } else {
        throw new Error("Failed to load products");
      }
    } catch (err) {
      this.loadingState = LOADING_STATES.REJECTED;
    }
  }
  async connectedCallback() {
    await this.fetchProducts();
  }

  attributeChangedCallback(name) {
    if (name !== "loading-state") {
      return;
    }

    // wait for products to finish loading before rendering
    if (this.loadingState === LOADING_STATES.RESOLVED) {
      this.renderProductListings();
    } else if (this.loadingState === LOADING_STATES.REJECTED) {
      this.renderErrorMessage(
        "Failed to load products. Please try again later.",
      );
    }
  }

  renderProductListings() {
    if (!this.products || this.products.length === 0) {
      return;
    }

    let html = "";

    for (const {
      sku,
      name,
      description,
      amount,
      size,
      image_url,
      instagram_url,
      quantity,
    } of this.products) {
      html += `
        <product-listing
          sku="${sku}"
          name="${name}"
          description="${description}"
          amount="${amount}"
          size="${size}"
          image-url="${image_url}"
          instagram-url="${instagram_url}"
          quantity="${quantity}"
        >
        </product-listing>
      `.trim();
    }

    this.innerHTML = html;
  }

  renderErrorMessage(message) {
    const alertErrorTemplate = document.getElementById(
      "alert-error-template",
    ).content;
    const alert = alertErrorTemplate.cloneNode(true);

    alert.querySelector('slot[name="error-message"]').innerText = message;

    this.append(alert);
  }
}

window.customElements.define("product-listings", ProductListings);
