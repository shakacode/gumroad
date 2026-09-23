# frozen_string_literal: true

class ProductRscDocumentRequestConstraint
  def self.matches?(request)
    request.format.html? &&
      request.path.match?(%r{\A/l/[^/]+\z}) &&
      request.params["layout"] == Product::Layout::PROFILE &&
      request.headers["X-Inertia-Partial-Data"].blank? &&
      request.params["embed"].blank? &&
      request.params["overlay"].blank?
  end
end
