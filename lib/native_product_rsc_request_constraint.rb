# frozen_string_literal: true

class NativeProductRscRequestConstraint
  def self.matches?(request)
    request.format.html? &&
      request.headers["X-Inertia-Partial-Data"].blank? &&
      request.params["embed"].blank? &&
      request.params["overlay"].blank?
  end
end
