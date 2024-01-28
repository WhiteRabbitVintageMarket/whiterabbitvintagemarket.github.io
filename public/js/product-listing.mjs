import {
  addProductToCart as addProductToCartLocalStorage,
  isProductInCart,
} from "/js/shopping-cart-local-storage.mjs";
import { formatPrice } from "/js/money.mjs";

class ProductListing extends HTMLElement {
  constructor() {
    super();

    this.sku = this.getAttribute("sku");
    this.name = this.getAttribute("name");
    this.description = this.getAttribute("description");
    this.amount = this.getAttribute("amount");
    this.size = this.getAttribute("size");
    this.imageUrl = this.getAttribute("image-url");
    this.instagramUrl = this.getAttribute("instagram-url");
    this.quantity = parseInt(this.getAttribute("quantity"), 10);
    this.isSold = this.quantity === 0;

    this.renderProductListing();
  }

  renderProductListing() {
    const productListingTemplate = document.getElementById(
      "product-listing-template",
    ).content;
    const productListing = productListingTemplate.cloneNode(true);

    productListing.querySelector("a").href = this.getProductUrl(this.sku);

    const imageElement = productListing.querySelector(
      'slot[name="product-image"] img',
    );
    imageElement.src = this.imageUrl;
    imageElement.alt = this.name;

    productListing.querySelector('slot[name="product-name"]').innerText =
      this.name;

    productListing.querySelector('slot[name="product-amount"]').innerText =
      formatPrice(this.amount);

    if (this.isSold === false) {
      productListing.querySelector('slot[name="product-sold"]').innerHTML = "";
    }

    this.appendChild(productListing);
  }

  showModal(event) {
    event.preventDefault();

    // only display 1 modal at a time
    if (this.querySelector("#modal-container")) {
      return;
    }

    this.addModalContent();
    this.querySelector("#modal-container").showModal();

    this.updateUrlQueryString({ "product-id": this.sku });
    this.logEventViewItem();

    window.addEventListener("keydown", this.closeModalWithEscapeKey.bind(this));

    // prevent background scrolling
    // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
    document.body.classList.add("h-screen", "overflow-y-hidden");
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.position = "fixed";

    this.isModalDisplayed = true;
  }

  addModalContent() {
    const modalTemplate = document.getElementById("modal-template").content;

    const modal = modalTemplate.cloneNode(true);

    modal.querySelector('slot[name="modal-title"]').innerText = this.name;
    modal.querySelector('slot[name="product-image"] img').src = this.imageUrl;

    const amountText = this.amount
      ? `${formatPrice(this.amount)} + shipping`
      : "";
    modal.querySelector('slot[name="product-amount"]').innerText = amountText;

    modal.querySelector('slot[name="product-description"]').innerText =
      this.description;
    modal.querySelector('slot[name="product-size"]').innerText = this.size;

    const instagramLinkContainer = modal.querySelector(
      'slot[name="instagram-link"]',
    );

    if (this.instagramUrl) {
      instagramLinkContainer.querySelector("a").href = this.instagramUrl;
    } else {
      instagramLinkContainer.remove();
    }

    const buttonAddToCart = modal.querySelector("#btn-add-to-cart");
    if (this.isSold) {
      buttonAddToCart.innerText = "Sold Out";
      buttonAddToCart.disabled = true;
    } else if (isProductInCart(this.sku)) {
      buttonAddToCart.innerText = "Added to Cart";
      buttonAddToCart.disabled = true;
    } else {
      buttonAddToCart.onclick = () => {
        this.addProductToCart();
        buttonAddToCart.innerText = "Added to Cart";
        buttonAddToCart.disabled = true;
      };
    }
    modal.querySelector("#modal-close").onclick = (event) => {
      event.preventDefault();
      this.closeModal();
    };

    this.appendChild(modal);
  }

  getProductUrl(productId) {
    const { pathname, search } = new URL(window.location.href);
    const params = new URLSearchParams(search);
    if (productId) {
      params.set("product-id", productId);
    } else {
      params.delete("product-id");
    }

    return params.size ? `${pathname}?${params.toString()}` : pathname;
  }

  updateUrlQueryString(queryParams) {
    // product-id is currently the only dynamic query param
    const newUrl = this.getProductUrl(queryParams["product-id"]);
    history.replaceState(null, null, newUrl);
  }

  addProductToCart() {
    addProductToCartLocalStorage(this.sku);
    this.logEventAddToCart();
  }

  logEventViewItem() {
    gtag("event", "view_item", {
      currency: "USD",
      value: Number(this.amount),
      items: [
        {
          item_id: this.sku,
          item_name: this.name,
          quantity: 1,
        },
      ],
    });
  }

  logEventAddToCart() {
    gtag("event", "add_to_cart", {
      currency: "USD",
      value: Number(this.amount),
      items: [
        {
          item_id: this.sku,
          item_name: this.name,
          quantity: 1,
        },
      ],
    });
  }

  closeModal() {
    const modalContainer = this.querySelector("#modal-container");
    if (!modalContainer) {
      return;
    }

    modalContainer.close();
    modalContainer.remove();
    this.updateUrlQueryString({ "product-id": "" });

    window.removeEventListener(
      "keydown",
      this.closeModalWithEscapeKey.bind(this),
    );

    // prevent background scrolling
    // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
    document.body.classList.remove("h-screen", "overflow-y-hidden");
    const scrollY = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }

  closeModalWithEscapeKey(event) {
    if (event.code === "Escape") {
      this.closeModal();
    }
  }

  connectedCallback() {
    this.querySelector("a").addEventListener(
      "click",
      this.showModal.bind(this),
    );

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product-id");
    if (productId === this.sku) {
      this.querySelector("a").click();
    }
  }
}

window.customElements.define("product-listing", ProductListing);
