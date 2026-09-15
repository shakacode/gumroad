"use client";

import * as React from "react";

import { NavigationButton } from "$app/components/Button";
import { useDomains } from "$app/components/DomainSettings";
import { Card, CardContent } from "$app/components/ui/Card";

export const ProductLicenseKeyLookup = () => {
  // This can render on seller and custom domains, where the relative lookup path is not routed.
  const { scheme, rootDomain } = useDomains();

  return (
    <section className="border-t border-border p-6">
      <Card>
        <CardContent asChild>
          <li>
            <h3 className="grow">Already bought this?</h3>
            <NavigationButton href={Routes.license_key_lookup_url({ protocol: scheme, host: rootDomain })}>
              View your information
            </NavigationButton>
          </li>
        </CardContent>
      </Card>
    </section>
  );
};
