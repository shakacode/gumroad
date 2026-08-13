# frozen_string_literal: true

class NativeProductRscRequestConstraint
  def self.matches?(request)
    request.params["rsc"] == "1" &&
      request.params["layout"] == Product::Layout::DISCOVER &&
      request.format.html? &&
      !request.inertia? &&
      request.headers["X-Inertia-Partial-Data"].blank?
  end
end
