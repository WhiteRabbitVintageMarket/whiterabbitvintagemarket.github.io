import {
  getCartLocalStorage,
  removeProductFromCart,
} from "/js/shopping-cart-local-storage.mjs";

import { formatPrice, calculateTotal } from "/js/money.mjs";

export const shoppingCartRenderEventName = "shoppingCartRender";

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
      this.renderShoppingCart();
    }
  }

  getSelectedProductsFromLocalStorage() {
    const { products: cartProducts } = getCartLocalStorage();

    const foundProducts = this.products.filter((product) => {
      const result = cartProducts.find(({ id }) => {
        const isSold = product.is_sold === "true";
        return id === product.sku && isSold === false;
      });
      return Boolean(result);
    });

    // remove any products from cart that are not found
    if (cartProducts.length !== foundProducts.length) {
      for (const cartProduct of cartProducts) {
        const result = this.products.find(({ sku }) => cartProduct.id === sku);
        if (!result) {
          removeProductFromCart(cartProduct.id);
        }
      }
    }

    return foundProducts;
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

    for (const { sku, image_url: imageUrl, name, amount } of selectedProducts) {
      this.renderProduct({
        container: unorderedList,
        sku,
        imageUrl,
        name,
        amount,
      });
    }

    this.appendChild(unorderedList);
    this.renderSummary(selectedProducts);
    this.logEventViewCart(selectedProducts);

    const eventUpdateCart = new CustomEvent(shoppingCartRenderEventName);
    window.dispatchEvent(eventUpdateCart);
  }

  renderProduct({ sku, imageUrl, name, amount, container }) {
    const shoppingCartListItemTemplate = document.getElementById(
      "shopping-cart-list-item-template",
    ).content;
    const listItem = shoppingCartListItemTemplate.cloneNode(true);

    const imageElement = listItem.querySelector(
      'slot[name="product-image"] img',
    );
    imageElement.src = imageUrl;
    imageElement.alt = name;

    listItem.querySelector('slot[name="product-name"]').innerText = name;
    listItem.querySelector('slot[name="product-amount"]').innerText =
      formatPrice(amount);

    listItem.querySelector("button").onclick = () => {
      removeProductFromCart(sku);
      this.logEventRemoveFromCart({ sku, name, amount });
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
    const itemsForGoogleTag = products.map(({ sku, name, amount }) => {
      return {
        item_id: sku,
        item_name: name,
        price: Number(amount),
        quantity: 1,
      };
    });

    gtag("event", "view_cart", {
      currency: "USD",
      value: calculateTotal(products),
      items: itemsForGoogleTag,
    });
  }

  logEventRemoveFromCart({ sku, name, amount }) {
    gtag("event", "remove_from_cart", {
      currency: "USD",
      value: Number(amount),
      items: [
        {
          item_id: sku,
          item_name: name,
          quantity: 1,
        },
      ],
    });
  }
}

window.customElements.define("shopping-cart", ShoppingCart);
