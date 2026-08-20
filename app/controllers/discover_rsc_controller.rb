# frozen_string_literal: true

class DiscoverRscController < DiscoverController
  include PublicRscRendering

  private
    def render_discover_rsc_document(discover_props)
      render_public_rsc_page(
        component_name: "DiscoverPage",
        props: discover_props,
        root_id: "discover-rsc-root"
      )
    end
end
