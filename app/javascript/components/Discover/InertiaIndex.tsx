import * as React from "react";

import { DiscoverIndex } from "$app/components/Discover/Index";
import { Layout } from "$app/components/Discover/Layout";

function DiscoverIndexPage() {
  return <DiscoverIndex renderLayout={(props, children) => <Layout {...props}>{children}</Layout>} />;
}

DiscoverIndexPage.loggedInUserLayout = true;
export default DiscoverIndexPage;
