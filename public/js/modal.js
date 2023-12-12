function initializeModal() {
  const productContainers = document.querySelectorAll(".product-container");
  const closeButtons = document.querySelectorAll(".modal-close");

  productContainers.forEach((product) =>
    product.addEventListener("click", launchModal),
  );
  closeButtons.forEach((button) =>
    button.addEventListener("click", closeModal),
  );
}

function launchModal(event) {
  const modalContainer = document.querySelector("#modal-container");
  modalContainer.classList.remove("hidden");
  modalContainer.classList.remove("pointer-events-none");
  // prevent background scrolling
  // https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
  document.body.classList.add("h-screen", "overflow-y-hidden");
  document.body.style.top = `-${window.scrollY}px`;
  document.body.style.position = "fixed";

  const selectedProduct = document.getElementById(
    event.currentTarget.getAttribute("id"),
  );
  addProductToModal(selectedProduct);
}

function closeModal() {
  const modalContainer = document.querySelector("#modal-container");
  modalContainer.classList.add("hidden");
  modalContainer.classList.add("pointer-events-none");
  document.body.classList.remove("h-screen", "overflow-y-hidden");
  const scrollY = document.body.style.top;
  document.body.style.position = "";
  document.body.style.top = "";
  window.scrollTo(0, parseInt(scrollY || "0") * -1);
  removeProductFromModal();
}

function addProductToModal(selectedProduct) {
  const modalContainer = document.querySelector("#modal-container");
  const modalTitle = modalContainer.querySelector(".modal-title");
  const productImage = modalContainer.querySelector(".product-image");
  const productDetail = modalContainer.querySelector(".product-detail");

  const { name, description, size, price, imageUrl, isSold } =
    selectedProduct.dataset;

  modalTitle.innerHTML = name;
  productImage.innerHTML = `<img src="${imageUrl}" alt="${name}" class="object-cover sm:h-[75vh]">`;

  if (isSold === "true") {
    productDetail.innerHTML +=
      '<span class="bg-red-100 text-red-800 text-sm font-medium rounded me-2 px-2.5 py-0.5 dark:bg-red-900 dark:text-red-300">Sold</span>';
  }

  if (price) {
    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
    productDetail.innerHTML += `<p class="my-4 font-bold">${formattedPrice} + shipping</p>`;
  }

  if (description) {
    productDetail.innerHTML += `<p class="my-4">${description}</p>`;
  }

  if (size) {
    productDetail.innerHTML += `<p class="my-4">${size}</p>`;
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
