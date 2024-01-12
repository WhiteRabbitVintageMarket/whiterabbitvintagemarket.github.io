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
