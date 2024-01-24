class ProductListings extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ["loading", "products"];
  }

  get loading() {
    return JSON.parse(this.getAttribute("loading"));
  }

  set loading(value) {
    value === true ? this.showLoadingSpinner() : this.hideLoadingSpinner();
    this.setAttribute("loading", JSON.stringify(value));
  }

  get products() {
    return JSON.parse(this.getAttribute("products"));
  }

  set products(value) {
    this.setAttribute("products", JSON.stringify(value));
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
    const response = await fetch(
      "https://white-rabbit-server.fly.dev/api/products",
    );
    const json = await response.json();
    this.products = json.data;
    this.loading = false;
  }
  async connectedCallback() {
    await this.fetchProducts();
  }

  attributeChangedCallback(name) {
    if (name === "products") {
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
          quantity="${quantity}"
        >
        </product-listing>
      `.trim();
    }

    this.innerHTML = html;
  }
}

window.customElements.define("product-listings", ProductListings);
