# frozen_string_literal: true

class DiscoverRscController < DiscoverController
  include PublicRscRendering

  private
    def render_native_discover_rsc(discover_props)
      render_public_rsc_page(
        component_name: "DiscoverPage",
        props: discover_props,
        root_id: "native-discover-rsc-root"
      )
    end
end
