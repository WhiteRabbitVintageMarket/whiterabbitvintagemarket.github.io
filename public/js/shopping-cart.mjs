import {
  getCartLocalStorage,
  removeProductFromCart,
} from "/js/shopping-cart-local-storage.mjs";

import { formatPrice, calculateTotal } from "/js/money.mjs";

class ShoppingCart extends HTMLElement {
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
    this.products = json;
    this.loading = false;
  }

  async connectedCallback() {
    await this.fetchProducts();
  }

  attributeChangedCallback() {
    this.renderShoppingCart();
  }

  getSelectedProductsFromLocalStorage() {
    const { products: cartProducts } = getCartLocalStorage();

    return this.products.filter((product) => {
      const result = cartProducts.find(({ id }) => id === product.id);
      return Boolean(result);
    });
  }

  renderShoppingCart() {
    if (!this.products || this.products.length === 0) {
      return;
    }

    this.innerHTML = "";
    const selectedProducts = this.getSelectedProductsFromLocalStorage();

    if (selectedProducts.length === 0) {
      const shoppingCartEmptyTemplate = document.getElementById(
        "shopping-cart-empty-template",
      ).content;
      return this.appendChild(shoppingCartEmptyTemplate.cloneNode(true));
    }

    const unorderedList = document.createElement("ul");
    unorderedList.id = "product-list";

    for (const { id, url, name, price } of selectedProducts) {
      this.renderProduct({
        container: unorderedList,
        id,
        url,
        name,
        price,
      });
    }

    this.appendChild(unorderedList);
    this.renderSummary(selectedProducts);
    this.logEventViewCart(selectedProducts);
  }

  renderProduct({ id, url, name, price, container }) {
    const shoppingCartListItemTemplate = document.getElementById(
      "shopping-cart-list-item-template",
    ).content;
    const listItem = shoppingCartListItemTemplate.cloneNode(true);

    listItem.querySelector('slot[name="product-image"] img').src = url;
    listItem.querySelector('slot[name="product-name"]').innerText = name;
    listItem.querySelector('slot[name="product-price"]').innerText =
      formatPrice(price);

    listItem.querySelector("button").onclick = () => {
      removeProductFromCart(id);
      this.logEventRemoveFromCart({ id, name, price });
      this.renderShoppingCart();
    };

    container.appendChild(listItem);
  }

  renderSummary(products) {
    const shoppingCartSummaryTemplate = document.getElementById(
      "shopping-cart-summary-template",
    ).content;
    const summary = shoppingCartSummaryTemplate.cloneNode(true);
    const subTotal = calculateTotal(products);
    summary.querySelector('slot[name="subtotal"]').innerText =
      formatPrice(subTotal);
    this.appendChild(summary);
  }

  logEventViewCart(products) {
    const itemsForGoogleTag = products.map(({ id, name, price }) => {
      return {
        item_id: id,
        item_name: name,
        price: Number(price),
        quantity: 1,
      };
    });

    gtag("event", "view_cart", {
      currency: "USD",
      value: calculateTotal(products),
      items: itemsForGoogleTag,
    });
  }

  logEventRemoveFromCart({ id, name, price }) {
    gtag("event", "remove_from_cart", {
      currency: "USD",
      value: Number(price),
      items: [
        {
          item_id: id,
          item_name: name,
          quantity: 1,
        },
      ],
    });
  }
}

window.customElements.define("shopping-cart", ShoppingCart);
