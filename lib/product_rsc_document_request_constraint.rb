# frozen_string_literal: true

class ProductRscDocumentRequestConstraint
  def self.matches?(request)
    return false unless request.get? && profile_request?(request) && !request.inertia? && request.params["wanted"] != "true"

    context = LinksController.new
    context.set_request!(request)
    context.set_response!(ActionDispatch::Response.new)
    # Release leases acquired here; earlier routing may already own a parent-thread lease.
    ActiveRecord::Base.connection_pool.with_connection(prevent_permanent_checkout: true) do
      context.send(:product_rsc_document_eligible?)
    end
  rescue ActionController::RoutingError
    false
  rescue StandardError
    # Selection runs before Sentry's controller around-action can name a lookup failure.
    Sentry.get_current_scope&.set_transaction_name("LinksController#show", source: :view)
    raise
  end

  def self.profile_request?(request)
    request.format.html? &&
      (request.headers["Accept"].blank? || request.accepts.any? { |format| format&.html? || format == Mime::ALL }) &&
      request.path.match?(%r{\A/l/[^/]+\z}) &&
      request.params["layout"].in?([nil, Product::Layout::PROFILE]) &&
      request.headers["X-Inertia-Partial-Data"].blank? &&
      request.params["embed"].blank? &&
      request.params["overlay"].blank?
  end
end
