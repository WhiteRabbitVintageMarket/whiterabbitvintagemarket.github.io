import {
  getCartLocalStorage,
  removeProductFromCart,
} from "/js/shopping-cart-local-storage.mjs";

import { formatPrice, calculateTotal } from "/js/money.mjs";

export const shoppingCartRenderEventName = "shoppingCartRender";

class ShoppingCart extends HTMLElement {
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

  async fetchProducts(skus) {
    this.loading = true;
    const params = new URLSearchParams();
    skus.forEach((sku) => params.append("sku[]", sku));

    const response = await fetch(
      `${window.config.apiBaseUrl}/api/products?${params.toString()}`,
    );
    const json = await response.json();
    this.products = json.data;
    this.loading = false;
  }

  async connectedCallback() {
    const { products } = getCartLocalStorage();
    if (products.length) {
      const skus = products.map(({ id: sku }) => sku);
      await this.fetchProducts(skus);
    } else {
      this.renderTemplateForEmptyCart();
    }
  }

  attributeChangedCallback(name) {
    // wait for products to finish loading before rendering
    const isFinishedLoadingProducts =
      this.products.length && name === "loading" && this.loading === false;
    if (isFinishedLoadingProducts) {
      this.renderShoppingCart();
    }
  }

  getSelectedProductsFromLocalStorage() {
    const { products: cartProducts } = getCartLocalStorage();

    const foundProducts = this.products.filter(({ sku, quantity }) => {
      const result = cartProducts.find(({ id: cartId }) => {
        const isSold = quantity === 0;
        if (isSold && cartId === sku) {
          removeProductFromCart(cartId);
          return;
        } else if (cartId === sku) {
          return true;
        }
      });
      return Boolean(result);
    });

    return foundProducts;
  }

  renderTemplateForEmptyCart() {
    const shoppingCartEmptyTemplate = document.getElementById(
      "shopping-cart-empty-template",
    ).content;
    return this.appendChild(shoppingCartEmptyTemplate.cloneNode(true));
  }

  renderShoppingCart() {
    this.innerHTML = "";
    const selectedProducts = this.getSelectedProductsFromLocalStorage();

    if (selectedProducts.length === 0) {
      return this.renderTemplateForEmptyCart();
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

    const productNameHyperlink = listItem.querySelector(
      'slot[name="product-name"] a',
    );
    productNameHyperlink.href = `/shop/?product-id=${sku}`;
    productNameHyperlink.innerText = name;

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
