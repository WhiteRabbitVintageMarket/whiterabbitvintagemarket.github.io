import {
  addProductToCart as addProductToCartLocalStorage,
  isProductInCart,
} from "/js/shopping-cart-local-storage.mjs";
import { formatPrice } from "/js/money.mjs";

class ProductListing extends HTMLElement {
  constructor() {
    super();

    this.id = this.getAttribute("id");
    this.name = this.getAttribute("name");
    this.description = this.getAttribute("description");
    this.price = this.getAttribute("price");
    this.size = this.getAttribute("size");
    this.imageUrl = this.getAttribute("image-url");

    const isSoldString = this.getAttribute("is-sold");
    this.isSold = isSoldString === "true";

    this.renderProductListing();
  }

  renderProductListing() {
    const productListingTemplate = document.getElementById(
      "product-listing-template",
    ).content;
    const productListing = productListingTemplate.cloneNode(true);

    productListing.querySelector('slot[name="product-image"] img').src =
      this.imageUrl;
    productListing.querySelector('slot[name="product-image"] img').alt =
      this.name;
    productListing.querySelector('slot[name="product-name"]').innerText =
      this.name;

    const price = this.price ? formatPrice(this.price) : "";
    productListing.querySelector('slot[name="product-price"]').innerText =
      price;

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
    this.updateUrlQueryString({ "product-id": this.id });
    this.querySelector("#modal-container").showModal();

    this.addEventListener("keydown", this.closeModalWithEscapeKey);

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

    const priceText = this.price ? `${formatPrice(this.price)} + shipping` : "";
    modal.querySelector('slot[name="product-price"]').innerText = priceText;

    modal.querySelector('slot[name="product-description"]').innerText =
      this.description;
    modal.querySelector('slot[name="product-size"]').innerText = this.size;

    const buttonAddToCart = modal.querySelector("#btn-add-to-cart");
    if (this.isSold) {
      buttonAddToCart.innerText = "Sold Out";
      buttonAddToCart.disabled = true;
    } else if (isProductInCart(this.id)) {
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

  updateUrlQueryString({ "product-id": productId }) {
    const { pathname, search } = new URL(window.location.href);
    const params = new URLSearchParams(search);
    if (productId) {
      params.set("product-id", productId);
    } else {
      params.delete("product-id");
    }

    const newUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
    history.replaceState(null, null, newUrl);
  }

  addProductToCart() {
    addProductToCartLocalStorage(this.id);
    this.logEventAddToCart();
  }

  logEventAddToCart() {
    gtag("event", "add_to_cart", {
      currency: "USD",
      value: Number(this.price),
      items: [
        {
          item_id: this.id,
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

    this.removeEventListener("keydown", this.closeModalWithEscapeKey);

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
    if (productId === this.id) {
      this.querySelector("a").click();
    }
  }
}

window.customElements.define("product-listing", ProductListing);
