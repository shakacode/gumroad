export type SeededNativeProduct = {
  name: string;
  label: string;
  permalink: string;
};

export const ADDITIONAL_SEEDED_NATIVE_PRODUCTS: SeededNativeProduct[] = [
  {
    label: "PowerShell",
    name: "Automating Microsoft 365 with PowerShell (2027 edition)",
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

const storefrontOrigin = (port: number) => `http://o365itpros.localhost:${port}`;
const seededProductUrl = (product: SeededNativeProduct, port: number) =>
  `${storefrontOrigin(port)}/l/${product.permalink}`;

export const seededSellerUrl = (port: number) => `${storefrontOrigin(port)}/`;

export const seededProfileProductUrl = (product: SeededNativeProduct, port: number) =>
  `${seededProductUrl(product, port)}?layout=profile`;

export const seededDiscoverProductUrl = (product: SeededNativeProduct, port: number) =>
  `${seededProductUrl(product, port)}?layout=discover&recommended_by=search`;
