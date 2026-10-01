import "react-on-rails-pro/registerDefaultRSCProvider/client";

import BasePage from "$app/utils/base_page";
import installBrowserTranslationGuard from "$app/utils/browser_translation_guard";

installBrowserTranslationGuard();
BasePage.initialize();
