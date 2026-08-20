# frozen_string_literal: true

class ProductRscDocumentRequestConstraint
  def self.matches?(request)
    request.format.html? &&
      request.accepts.exclude?(Mime[:json]) &&
      (request.path != "/" || ProductCustomDomainConstraint.matches?(request)) &&
      request.headers["X-Inertia-Partial-Data"].blank? &&
      request.params["embed"].blank? &&
      request.params["overlay"].blank?
  end
end
