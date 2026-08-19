# frozen_string_literal: true

class ProfileRscUsersController < UsersController
  include PublicRscRendering

  private
    def render_native_profile_rsc(profile_props)
      render_public_rsc_page(
        component_name: "NativeProfileRscPage",
        props: profile_props,
        root_id: "native-profile-rsc-root"
      )
    end
end
