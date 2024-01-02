export function formatPrice(price) {
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
  console.log(productsArray);
  const total = productsArray.reduce((partialSum, product) => {
    const quantity = product.quantity ?? 1;
    const newTotal =
      partialSum + parseFloat(product.price) * parseInt(quantity);
    return newTotal;
  }, 0);
  return roundTwoDecimals(total);
}
