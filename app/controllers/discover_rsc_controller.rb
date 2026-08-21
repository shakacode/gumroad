# frozen_string_literal: true

class DiscoverRscController < DiscoverController
  include PublicRscRendering

  private
    def render_discover_page(discover_props)
      black_friday_feature_active = black_friday_feature_active?
      render_public_rsc_page(
        component_name: "DiscoverPage",
        props: discover_props.merge(
          show_black_friday_hero: black_friday_feature_active,
          black_friday_stats: black_friday_feature_active ? BlackFridayStatsService.fetch_stats : nil,
          recommended_wishlists: recommended_wishlists_data,
          recently_viewed: recently_viewed_data,
        ),
        root_id: "discover-rsc-root",
        async_props: {
          recommended_products: -> {
            ActiveRecord::Base.connection_pool.with_connection { recommendations }
          }
        }
      )
    end
end
