export function getTemplate(templateId) {
  const template = document.getElementById(templateId);

  if (template === null) {
    throw new Error(`Cannot find template "${templateId}"`);
  }

  return template.content.cloneNode(true);
}

export function formatPrice(price = "") {
  if (price === "") {
    return "";
  }
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

  return formattedPrice;
}

export function roundTwoDecimals(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateTotal(productsArray) {
  const total = productsArray.reduce((partialSum, { amount, quantity = 1 }) => {
    const newTotal = partialSum + parseFloat(amount) * parseInt(quantity);
    return newTotal;
  }, 0);
  return roundTwoDecimals(total);
}

export const LOADING_STATES = {
  INITIAL: "INITIAL",
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};
