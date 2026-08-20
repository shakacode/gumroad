# frozen_string_literal: true

class NativePublicRscRequestConstraint
  def self.matches?(request)
    enabled?(request) &&
      request.format.html? &&
      !request.inertia? &&
      request.headers["X-Inertia-Partial-Data"].blank?
  end

  def self.enabled?(request)
    request.params["rsc"] == "1" ||
      ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] == "1"
  end
  private_class_method :enabled?
end
