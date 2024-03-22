import {
  addProductToCart as addProductToCartLocalStorage,
  isProductInCart,
} from "/js/shopping-cart-local-storage.mjs";
import { formatPrice, getTemplate } from "/js/utils.mjs";

class ProductListing extends HTMLElement {
  #templates;

  constructor() {
    super();

    this.#templates = {
      productListing: getTemplate("product-listing-template"),
      modal: getTemplate("modal-template"),
    };

    const quantity = parseInt(this.getAttribute("quantity"), 10);

    this.product = {
      sku: this.getAttribute("sku"),
      name: this.getAttribute("name"),
      description: this.getAttribute("description"),
      amount: this.getAttribute("amount"),
      size: this.getAttribute("size"),
      imageUrl: this.getAttribute("image-url"),
      instagramUrl: this.getAttribute("instagram-url"),
      quantity,
      isSold: quantity === 0,
    };

    this.#renderProductListing(this.product);
  }

  #renderProductListing({ sku, imageUrl, name, amount, isSold }) {
    const productListing = this.#templates.productListing;
    productListing.querySelector("a").href = getProductUrl(sku);

    const imageElement = productListing.querySelector(
      'slot[name="product-image"] img',
    );
    imageElement.src = imageUrl;
    imageElement.alt = name;

    productListing.querySelector('slot[name="product-name"]').innerText = name;

    productListing.querySelector('slot[name="product-amount"]').innerText =
      formatPrice(amount);

    if (isSold === false) {
      productListing.querySelector('slot[name="product-sold"]').innerHTML = "";
    }

    this.appendChild(productListing);
  }

  #showModal(product) {
    const { sku, imageUrl, name, description } = product;

    if (!this.querySelector("#modal-container")) {
      this.#addModalContent(product);
    }

    this.querySelector("#modal-container").showModal();

    updateUrlQueryString({ "product-id": sku });

    updateMetaTags({
      name,
      description,
      sku,
      imageUrl,
    });

    logEventViewItem(product);

    window.addEventListener(
      "keydown",
      this.#closeModalWithEscapeKey.bind(this),
    );

    // prevent background scrolling
    // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
    document.body.classList.add("h-screen", "overflow-y-hidden");
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.position = "fixed";
  }

  #addModalContent({
    sku,
    imageUrl,
    name,
    amount,
    description,
    size,
    instagramUrl,
    isSold,
    quantity,
  }) {
    const modal = this.#templates.modal;

    modal.querySelector('slot[name="modal-title"]').innerText = name;
    modal.querySelector('slot[name="product-image"] img').src = imageUrl;

    const amountText = amount ? `${formatPrice(amount)} + shipping` : "";
    modal.querySelector('slot[name="product-amount"]').innerText = amountText;

    modal.querySelector('slot[name="product-description"]').innerText =
      description;
    modal.querySelector('slot[name="product-size"]').innerText = size;

    const instagramLinkContainer = modal.querySelector(
      'slot[name="instagram-link"]',
    );

    if (instagramUrl) {
      instagramLinkContainer.querySelector("a").href = instagramUrl;
    } else {
      instagramLinkContainer.remove();
    }

    const buttonAddToCart = modal.querySelector("#btn-add-to-cart");
    if (isSold) {
      buttonAddToCart.innerText = "Sold Out";
      buttonAddToCart.disabled = true;
    } else if (isProductInCart(sku)) {
      buttonAddToCart.innerText = "Added to Cart";
      buttonAddToCart.disabled = true;
    } else {
      buttonAddToCart.onclick = () => {
        addProductToCartLocalStorage(sku);
        logEventAddToCart({ sku, name, amount, quantity });
        buttonAddToCart.innerText = "Added to Cart";
        buttonAddToCart.disabled = true;
      };
    }
    modal.querySelector("#modal-close").onclick = (event) => {
      event.preventDefault();
      this.#closeModal();
    };

    this.appendChild(modal);
  }

  #closeModal() {
    const modalContainer = this.querySelector("#modal-container");
    if (!modalContainer) {
      return;
    }

    modalContainer.close();
    updateUrlQueryString({ "product-id": "" });
    updateMetaTags({
      name: "",
      description: "",
      sku: "",
      imageUrl: "",
    });

    window.removeEventListener(
      "keydown",
      this.#closeModalWithEscapeKey.bind(this),
    );

    // prevent background scrolling
    // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
    document.body.classList.remove("h-screen", "overflow-y-hidden");
    const scrollY = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }

  #closeModalWithEscapeKey(event) {
    if (event.code === "Escape") {
      this.#closeModal();
    }
  }

  connectedCallback() {
    this.querySelector("a").addEventListener("click", (event) => {
      event.preventDefault();
      this.#showModal(this.product);
    });

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product-id");
    if (productId === this.product.sku) {
      this.querySelector("a").click();
    }
  }
}

window.customElements.define("product-listing", ProductListing);

function getProductUrl(productId) {
  const { pathname, search } = new URL(window.location.href);
  const params = new URLSearchParams(search);
  if (productId) {
    params.set("product-id", productId);
  } else {
    params.delete("product-id");
  }

  return params.size ? `${pathname}?${params.toString()}` : pathname;
}

function updateUrlQueryString(queryParams) {
  // product-id is currently the only dynamic query param
  const newUrl = getProductUrl(queryParams["product-id"]);
  history.replaceState(null, null, newUrl);
}

function updateMetaTags({ name, description, sku, imageUrl }) {
  const updateMetaTag = ({ name, value }) => {
    const attributeName = name.startsWith("og:") ? "property" : "name";
    let metaElement = document.querySelector(
      `meta[${attributeName}="${name}"]`,
    );

    if (metaElement) {
      metaElement.setAttribute("content", value);
    } else {
      metaElement = document.createElement("meta");
      metaElement.setAttribute(attributeName, name);
      metaElement.setAttribute("content", value);
      document.head.appendChild(metaElement);
    }
  };

  updateMetaTag({ name: "og:title", value: name });
  updateMetaTag({ name: "description", value: description });
  updateMetaTag({ name: "og:description", value: description });
  updateMetaTag({ name: "og:image", value: imageUrl });

  const productUrl = sku
    ? `${window.location.origin}${getProductUrl(sku)}`
    : "";
  updateMetaTag({ name: "og:url", value: productUrl });
}

function logEventViewItem({ sku, name, amount, quantity }) {
  gtag("event", "view_item", {
    currency: "USD",
    value: Number(amount),
    items: [
      {
        item_id: sku,
        item_name: name,
        quantity,
      },
    ],
  });
}

function logEventAddToCart({ sku, name, amount, quantity }) {
  gtag("event", "add_to_cart", {
    currency: "USD",
    value: Number(amount),
    items: [
      {
        item_id: sku,
        item_name: name,
        quantity,
      },
    ],
  });
}
