import { addProductToCart, isProductInCart } from "/js/cart.mjs";

export function initializeModal() {
  const productContainers = document.querySelectorAll(".product-container");
  const closeButton = document.querySelector("#modal-close");

  productContainers.forEach((product) =>
    product.addEventListener("click", showModal),
  );

  closeButton.addEventListener("click", closeModal),
    document.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        closeModal();
      }
    });
}

function showModal(event) {
  event.preventDefault();

  const modalContainer = document.querySelector("#modal-container");
  modalContainer.showModal();
  const selectedProduct = document.getElementById(
    event.currentTarget.getAttribute("id"),
  );
  addProductToModal(selectedProduct);

  // prevent background scrolling
  // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
  document.body.classList.add("h-screen", "overflow-y-hidden");
  document.body.style.top = `-${window.scrollY}px`;
  document.body.style.position = "fixed";
}

function closeModal() {
  const modalContainer = document.querySelector("#modal-container");
  modalContainer.close();
  removeProductFromModal();
  // prevent background scrolling
  // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
  document.body.classList.remove("h-screen", "overflow-y-hidden");
  const scrollY = document.body.style.top;
  document.body.style.position = "";
  document.body.style.top = "";
  window.scrollTo(0, parseInt(scrollY || "0") * -1);
}

function addProductToModal(selectedProduct) {
  const modalContainer = document.querySelector("#modal-container");
  const modalTitle = modalContainer.querySelector(".modal-title");
  const productImage = modalContainer.querySelector(".product-image");
  const productDetail = modalContainer.querySelector(".product-detail");

  const {
    id,
    name,
    description,
    size,
    price,
    imageUrl,
    isSold: isSoldString,
  } = selectedProduct.dataset;

  const isSold = isSoldString === "true";

  modalTitle.innerHTML = name;
  productImage.innerHTML = `<img src="${imageUrl}" alt="${name}" class="object-cover sm:h-[75vh]">`;

  if (isSold) {
    const soldBadgeContainer = document.createElement("p");
    soldBadgeContainer.classList.add("mb-4");

    const soldBadge = document.createElement("span");
    soldBadge.innerText = "Sold";
    soldBadge.classList.add(
      "bg-red-100",
      "text-red-800",
      "text-sm",
      "font-medium",
      "rounded",
      "me-2",
      "px-2.5",
      "py-0.5",
      "dark:bg-red-900",
      "dark:text-red-300",
    );

    soldBadgeContainer.appendChild(soldBadge);
    productDetail.appendChild(soldBadgeContainer);
  }

  if (price) {
    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

    const priceContainer = document.createElement("p");
    priceContainer.classList.add("font-bold");
    priceContainer.innerText = `${formattedPrice} + shipping`;
    productDetail.appendChild(priceContainer);
  }

  if (isSold === false) {
    const buttonAddToCart = document.createElement("button");
    buttonAddToCart.setAttribute("type", "button");
    buttonAddToCart.autofocus = true;
    buttonAddToCart.classList.add(
      "btn-add-to-cart",
      "mt-4",
      "w-full",
      "bg-stone-950",
      "custom-text-pure-white",
      "hover:bg-stone-700",
      "disabled:bg-stone-700",
      "focus:ring-4",
      "focus:ring-blue-300",
      "focus:outline-none",
      "text-lg",
      "rounded-lg",
      "px-5",
      "py-2.5",
    );

    buttonAddToCart.onclick = (event) => {
      addProductToCart({ id, name, price, imageUrl });
      buttonAddToCart.innerText = "Added to Cart";
      buttonAddToCart.disabled = true;
    };

    if (isProductInCart(id)) {
      buttonAddToCart.innerText = "Added to Cart";
      buttonAddToCart.disabled = true;
    } else {
      buttonAddToCart.innerText = "Add to Cart";
    }

    productDetail.appendChild(buttonAddToCart);
  }

  if (description) {
    const descriptionContainer = document.createElement("p");
    descriptionContainer.classList.add("my-4");
    descriptionContainer.innerText = description;
    productDetail.appendChild(descriptionContainer);
  }

  if (size) {
    const sizeContainer = document.createElement("p");
    sizeContainer.classList.add("my-4");
    sizeContainer.innerText = size;
    productDetail.appendChild(sizeContainer);
  }
}

function removeProductFromModal() {
  const modalContainer = document.querySelector("#modal-container");
  const modalTitle = modalContainer.querySelector(".modal-title");
  const productImage = modalContainer.querySelector(".product-image");
  const productDetail = modalContainer.querySelector(".product-detail");

  productDetail.innerHTML = "";
  modalTitle.innerHTML = "";
  productImage.innerHTML = "";
}
