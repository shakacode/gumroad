# frozen_string_literal: true

class ProfileRscUsersController < UsersController
  include PublicRscRendering

  private
    def render_profile_page(profile_props)
      render_public_rsc_page(
        component_name: "ProfileRscCompatibilityPage",
        props: profile_props,
        root_id: "profile-rsc-root"
      )
    end
end
