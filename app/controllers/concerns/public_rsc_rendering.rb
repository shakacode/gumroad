# frozen_string_literal: true

module PublicRscRendering
  extend ActiveSupport::Concern

  include ReactOnRailsPro::Stream
  include LiveActiveRecordConnectionCleanup
  include LiveStreamingResponseHeaders

  included do
    before_action :prepare_live_streaming_response
    prepend_around_action :clear_live_active_record_connections
    prepend_around_action :close_live_response_stream
    helper_method :content_security_policy_nonce
  end

  private
    def render_public_rsc_page(component_name:, props:, root_id:)
      @precomputed_rendering_context = RenderingExtension.custom_context(view_context)
      @public_rsc_component_name = component_name
      @public_rsc_root_id = root_id
      @public_rsc_props = props.merge(
        _inertia_meta: inertia_meta.meta_tags,
        global: inertia_shared_data.except(:csp_nonce).compact.merge(href: request.original_url)
      )
      release_live_active_record_connections

      stream_view_containing_react_components(
        template: "public_rsc/show",
        layout: "inertia",
        rsc_stream_observability: true
      )
    end

    def close_live_response_stream
      yield
    ensure
      response.stream.close unless response.stream.closed?
    end

    def content_security_policy_nonce(*)
      SecureHeaders.content_security_policy_script_nonce(request)
    end
end
