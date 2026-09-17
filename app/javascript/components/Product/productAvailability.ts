export type ProductAvailability = {
  is_compliance_blocked: boolean;
  is_published: boolean;
  quantity_remaining: number | null;
};

export const getNotForSaleMessage = (product: ProductAvailability) =>
  product.is_compliance_blocked
    ? "Sorry, this item is not available in your location."
    : product.quantity_remaining === 0
      ? "Sold out, please go back and pick another option."
      : !product.is_published
        ? "This product is not currently for sale."
        : null;
