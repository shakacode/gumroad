import ReactOnRails from "react-on-rails-pro/client";

import BasePage from "$app/utils/base_page";
import installBrowserTranslationGuard from "$app/utils/browser_translation_guard";

import NativeProductPage from "./NativeProductRscPage";

installBrowserTranslationGuard();
BasePage.initialize();
ReactOnRails.register({ NativeProductPage });
