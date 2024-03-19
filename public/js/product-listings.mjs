class ProductListings extends HTMLElement {
  constructor() {
    super();
    this.products = [];
  }

  static get observedAttributes() {
    return ["loading"];
  }

  get loading() {
    return JSON.parse(this.getAttribute("loading"));
  }

  set loading(value) {
    value === true ? this.showLoadingSpinner() : this.hideLoadingSpinner();
    this.setAttribute("loading", JSON.stringify(value));
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
    this.loading = true;
    const response = await fetch(`${window.config.apiBaseUrl}/api/products`);
    const json = await response.json();
    this.products = json.data;
    this.loading = false;
  }
  async connectedCallback() {
    await this.fetchProducts();
  }

  attributeChangedCallback(name) {
    // wait for products to finish loading before rendering
    const isFinishedLoadingProducts =
      this.products.length && name === "loading" && this.loading === false;
    if (isFinishedLoadingProducts) {
      this.renderProductListings();
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
}

window.customElements.define("product-listings", ProductListings);
