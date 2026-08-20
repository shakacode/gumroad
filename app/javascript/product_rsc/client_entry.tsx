import "react-on-rails-pro/registerDefaultRSCProvider/client";
import registerServerComponent from "react-on-rails-pro/registerServerComponent/client";

import BasePage from "$app/utils/base_page";
import installBrowserTranslationGuard from "$app/utils/browser_translation_guard";

installBrowserTranslationGuard();
BasePage.initialize();
registerServerComponent("ProductPage");
registerServerComponent("DiscoverPage");
registerServerComponent("ProfileRscCompatibilityPage");
