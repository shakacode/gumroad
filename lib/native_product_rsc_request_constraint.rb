# frozen_string_literal: true

class NativeProductRscRequestConstraint
  def self.matches?(request)
    (request.params["rsc"] == "1" || ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"] == "1") &&
      request.params["layout"] == Product::Layout::DISCOVER &&
      request.format.html? &&
      !request.inertia? &&
      request.headers["X-Inertia-Partial-Data"].blank?
  end
end
