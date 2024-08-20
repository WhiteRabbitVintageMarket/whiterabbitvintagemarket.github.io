import {
  getCartLocalStorage,
  removeProductFromCart,
} from "/js/shopping-cart-local-storage.mjs";

import {
  formatPrice,
  calculateTotal,
  getTemplate,
  LOADING_STATES,
} from "/js/utils.mjs";

export const shoppingCartRenderEventName = "shoppingCartRender";

class ShoppingCart extends HTMLElement {
  #templates;

  constructor() {
    super();

    this.products = [];

    this.#templates = {
      loadingSpinner: getTemplate("loading-spinner-template"),
      shoppingCartEmpty: getTemplate("shopping-cart-empty-template"),
      alertError: getTemplate("alert-error-template"),
      getNewShoppingCartSummary: () =>
        getTemplate("shopping-cart-summary-template"),
      getNewShoppingCartListItem: () =>
        getTemplate("shopping-cart-list-item-template"),
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
      this.#showLoadingSpinner();
    } else {
      this.#hideLoadingSpinner();
    }
    this.setAttribute("loading-state", value);
  }

  #showLoadingSpinner() {
    this.appendChild(this.#templates.loadingSpinner);
  }

  #hideLoadingSpinner() {
    const loadingSpinner = document.querySelector("#loading-spinner");
    if (loadingSpinner) {
      loadingSpinner.remove();
    }
  }

  async #fetchProducts(skus) {
    try {
      this.loadingState = LOADING_STATES.PENDING;

      const params = new URLSearchParams();
      skus.forEach((sku) => params.append("sku[]", sku));

      const response = await fetch(
        `${window.config.apiBaseUrl}/api/products?${params.toString()}`,
      );
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
    const { products } = getCartLocalStorage();
    if (products.length) {
      const skus = products.map(({ id: sku }) => sku);
      await this.#fetchProducts(skus);
    } else {
      this.#renderTemplateForEmptyCart();
    }
  }

  attributeChangedCallback(name) {
    if (name !== "loading-state") {
      return;
    }

    // wait for products to finish loading before rendering
    if (this.loadingState === LOADING_STATES.RESOLVED) {
      this.#renderShoppingCart();
    } else if (this.loadingState === LOADING_STATES.REJECTED) {
      this.#renderErrorMessage(
        "Failed to load products. Please try again later.",
      );
    }
  }

  #renderTemplateForEmptyCart() {
    return this.appendChild(this.#templates.shoppingCartEmpty);
  }

  #renderShoppingCart() {
    this.innerHTML = "";
    const selectedProducts = getSelectedProductsFromLocalStorage(this.products);

    if (selectedProducts.length === 0) {
      return this.#renderTemplateForEmptyCart();
    }

    const unorderedList = document.createElement("ul");
    unorderedList.id = "product-list";

    for (const { sku, image_url: imageUrl, name, amount } of selectedProducts) {
      this.#renderProduct({
        container: unorderedList,
        sku,
        imageUrl,
        name,
        amount,
      });
    }

    this.appendChild(unorderedList);
    this.#renderSummary(selectedProducts);
    logEventViewCart(selectedProducts);

    const eventUpdateCart = new CustomEvent(shoppingCartRenderEventName);
    window.dispatchEvent(eventUpdateCart);
  }

  #renderProduct({ sku, imageUrl, name, amount, container }) {
    const listItem = this.#templates.getNewShoppingCartListItem();

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
      logEventRemoveFromCart({ sku, name, amount });
      this.#renderShoppingCart();
    };

    container.appendChild(listItem);
  }

  #renderSummary(products) {
    const summary = this.#templates.getNewShoppingCartSummary();
    const subTotal = calculateTotal(products);
    summary.querySelector('slot[name="subtotal"]').innerText =
      formatPrice(subTotal);
    this.appendChild(summary);
  }

  #renderErrorMessage(message) {
    this.#templates.alertError.querySelector(
      'slot[name="error-message"]',
    ).innerText = message;
    this.append(this.#templates.alertError);
  }
}

window.customElements.define("shopping-cart", ShoppingCart);

function getSelectedProductsFromLocalStorage(products) {
  const { products: cartProducts } = getCartLocalStorage();

  const foundProducts = products.filter(({ sku, quantity }) => {
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

function logEventViewCart(products) {
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

function logEventRemoveFromCart({ sku, name, amount }) {
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
