import "react-on-rails-pro";
import registerServerComponent from "react-on-rails-pro/registerServerComponent/server";

import DiscoverPage from "$app/components/Discover/DiscoverPage";
import ProductPage from "$app/components/Product/ProductPage";
import ProfileRscCompatibilityPage from "$app/components/Profile/ProfileRscCompatibilityPage.client";

registerServerComponent({ ProductPage, ProfileRscCompatibilityPage, DiscoverPage });
