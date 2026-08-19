import "react-on-rails-pro";
import registerServerComponent from "react-on-rails-pro/registerServerComponent/server";

import NativeDiscoverRscPage from "./NativeDiscoverRscPage";
import NativeProductRscPage from "./NativeProductRscPage";
import NativeProfileRscPage from "./NativeProfileRscPage";

registerServerComponent({ NativeProductRscPage, NativeProfileRscPage, NativeDiscoverRscPage });
