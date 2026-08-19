export const P1_PROFILE = {
  sellerName: "ShakaPerf Microsoft 365 Lab",
  username: "shakaperfprofile",
  visibleProductCount: 16,
  firstProductName: "Tenant Operations Handbook",
  firstProductPermalink: "profile-simple-a",
} as const;

const profileOrigin = (port: number) => `http://${P1_PROFILE.username}.localhost:${port}`;

export const p1ProfileUrl = (port: number) => `${profileOrigin(port)}/`;

export const p1ProfileProductUrl = (port: number) =>
  `${profileOrigin(port)}/l/${P1_PROFILE.firstProductPermalink}?layout=profile`;

export const P1_DISCOVER = {
  categoryHeading: "Programming",
  categoryPath: "/software-development/programming",
  searchPath: "/discover?query=ShakaPerf&sort=newest",
  productCount: 24,
  firstProductName: "ShakaPerf Programming Kit 01",
  firstProductPermalink: "shakaperf-programming-1",
  lastProductName: "ShakaPerf Programming Kit 24",
} as const;

export const p1DiscoverCategoryUrl = (port: number) => `http://localhost:${port}${P1_DISCOVER.categoryPath}`;

export const p1DiscoverSearchUrl = (port: number) => `http://localhost:${port}${P1_DISCOVER.searchPath}`;

export const p1DiscoverProductUrl = (port: number) =>
  `http://shakaperfdiscovera.localhost:${port}/l/${P1_DISCOVER.firstProductPermalink}?layout=discover&recommended_by=discover`;
