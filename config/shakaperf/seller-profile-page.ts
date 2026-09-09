export const SELLER_PROFILE = {
  sellerName: "ShakaPerf Microsoft 365 Lab",
  username: "shakaperfprofile",
  visibleProductCount: 16,
  firstProductName: "Tenant Operations Handbook",
  firstProductPermalink: "profile-simple-a",
} as const;

const profileOrigin = (port: number) => {
  const host =
    port === Number(process.env.SHAKAPERF_CONTROL_PORT || 3100) ? "control.localhost" : "experiment.localhost";
  return `http://${SELLER_PROFILE.username}.${host}:${port}`;
};

export const sellerProfileUrl = (port: number) => `${profileOrigin(port)}/`;

export const sellerProfileProductUrl = (port: number) =>
  `${profileOrigin(port)}/l/${SELLER_PROFILE.firstProductPermalink}?layout=profile`;
