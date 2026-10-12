"use client";

import * as React from "react";

import { trackUserProductAction } from "$app/data/user_action_event";
import { assertResponseError } from "$app/utils/request";

import { Button, NavigationButton } from "$app/components/Button";
import { CopyToClipboard } from "$app/components/CopyToClipboard";
import { ReviewForm } from "$app/components/ReviewForm";

export const ProductReceiptCopyLicenseKeyAction = ({ licenseKey }: { licenseKey: string }) => (
  <CopyToClipboard text={licenseKey}>
    <Button>Copy</Button>
  </CopyToClipboard>
);

export const ProductReceiptReviewAction = (props: React.ComponentProps<typeof ReviewForm>) => <ReviewForm {...props} />;

export const ProductReceiptViewContentAction = ({
  children,
  href,
  permalink,
}: {
  children: React.ReactNode;
  href: string;
  permalink: string;
}) => (
  <NavigationButton
    color="primary"
    href={href}
    target="_blank"
    onClick={() =>
      void trackUserProductAction({
        name: "product_information_view_product",
        permalink,
      }).catch(assertResponseError)
    }
  >
    {children}
  </NavigationButton>
);

export const ProductReceiptMembershipAction = ({
  href,
  permalink,
  subscriptionHasLapsed,
}: {
  href: string;
  permalink: string;
  subscriptionHasLapsed: boolean;
}) => (
  <NavigationButton
    href={href}
    target="_blank"
    onClick={() =>
      void trackUserProductAction({
        name: "product_information_manage_membership",
        permalink,
      }).catch(assertResponseError)
    }
    className="grow basis-0"
  >
    {subscriptionHasLapsed ? "Restart membership" : "Manage membership"}
  </NavigationButton>
);
