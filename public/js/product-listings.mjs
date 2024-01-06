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
    this.setAttribute("loading", JSON.stringify(value));
  }
  get products() {
    return JSON.parse(this.getAttribute("products"));
  }
  set products(value) {
    this.setAttribute("products", JSON.stringify(value));
  }
  async fetchProducts() {
    this.loading = true;
    const response = await fetch("/data/products.json");
    const json = await response.json();
    this.products = json.reverse();
    this.loading = false;
  }
  async connectedCallback() {
    await this.fetchProducts();
  }

  attributeChangedCallback() {
    this.renderProductListings();
  }

  renderProductListings() {
    if (!this.products || this.products.length === 0) {
      return;
    }

    let html = "";

    for (const { id, name, description, price, size, url, sold } of this
      .products) {
      html += `
        <product-listing
          id="${id}"
          name="${name}"
          description="${description}"
          price="${price}"
          size="${size}"
          image-url="${url}"
          is-sold="${sold}"

        >
        </product-listing>
      `.trim();
    }

    this.innerHTML = html;
  }
}

window.customElements.define("product-listings", ProductListings);
