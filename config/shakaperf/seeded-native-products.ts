export type SeededNativeProduct = {
  name: string;
  label: string;
  permalink: string;
};

export const ADDITIONAL_SEEDED_NATIVE_PRODUCTS: SeededNativeProduct[] = [
  {
    label: "PowerShell",
    name: "Automating Microsoft 365 with PowerShell (2027 Edition)",
    permalink: "M365PS",
  },
  {
    label: "Purview",
    name: "Microsoft Purview for IT Pros (2027 Edition)",
    permalink: "M365Purview",
  },
  {
    label: "Power Platform",
    name: "Power Platform for IT Pros (2027 Edition)",
    permalink: "PowerPlatform",
  },
];

const productPath = (permalink: string) => `/l/${permalink}?layout=discover&recommended_by=search`;

export const seededNativeProductUrl = (product: SeededNativeProduct, port: number) =>
  `http://o365itpros.localhost:${port}${productPath(product.permalink)}`;
