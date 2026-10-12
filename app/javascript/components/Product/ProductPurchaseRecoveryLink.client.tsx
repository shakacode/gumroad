"use client";

import * as React from "react";

import { trackUserProductAction } from "$app/data/user_action_event";
import { assertResponseError } from "$app/utils/request";

import { useDomains } from "$app/components/DomainSettings";

export const ProductPurchaseRecoveryLink = ({
  permalink,
  isLicensed,
  hasDownload,
  disableAnalytics,
}: {
  permalink: string;
  isLicensed: boolean;
  hasDownload: boolean;
  disableAnalytics: boolean | undefined;
}) => {
  // The lookup route only exists on the root domain, including for products on custom domains.
  const { scheme, rootDomain } = useDomains();

  return (
    <p className="text-center text-sm">
      Already bought this?{" "}
      <a
        href={Routes.license_key_lookup_url({ protocol: scheme, host: rootDomain })}
        className="relative inline-block underline after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2"
        onClick={() => {
          if (!disableAnalytics)
            trackUserProductAction({ name: "product_purchase_recovery_click", permalink, keepalive: true }).catch(
              assertResponseError,
            );
        }}
      >
        {isLicensed ? "View your information" : hasDownload ? "Get your download link" : "Resend your receipt"}
      </a>
    </p>
  );
};
