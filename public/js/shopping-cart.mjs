import {
  getCartLocalStorage,
  removeProductFromCart,
} from "/js/shopping-cart-local-storage.mjs";

import { formatPrice, calculateTotal } from "/js/money.mjs";

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.selectedProducts = this.getSelectedProductsFromLocalStorage();
    this.renderShoppingCart();
  }

  getSelectedProductsFromLocalStorage() {
    const { products: cartProducts } = getCartLocalStorage();

    return window.allProducts.filter((product) => {
      const result = cartProducts.find(({ id }) => id === product.id);
      return Boolean(result);
    });
  }

  renderShoppingCart() {
    this.innerHTML = "";
    const products = this.selectedProducts;

    if (products.length === 0) {
      const shoppingCartEmptyTemplate = document.getElementById(
        "shopping-cart-empty-template",
      ).content;
      return this.appendChild(shoppingCartEmptyTemplate.cloneNode(true));
    }

    const unorderedList = document.createElement("ul");
    unorderedList.id = "product-list";

    for (const { id, url, name, price } of products) {
      this.renderProduct({
        container: unorderedList,
        id,
        url,
        name,
        price,
      });
    }

    this.appendChild(unorderedList);
    this.renderSummary(products);
    this.logEventViewCart();
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

    listItem.querySelector("button").onclick = (event) => {
      removeProductFromCart(id);
      this.logEventRemoveFromCart({ id, name, price });
      this.selectedProducts = this.getSelectedProductsFromLocalStorage();
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

  logEventViewCart() {
    const itemsForGoogleTag = this.selectedProducts.map(
      ({ id, name, price }) => {
        return {
          item_id: id,
          item_name: name,
          price: Number(price),
          quantity: 1,
        };
      },
    );

    gtag("event", "view_cart", {
      currency: "USD",
      value: calculateTotal(this.selectedProducts),
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
