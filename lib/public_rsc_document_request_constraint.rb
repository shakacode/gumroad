# frozen_string_literal: true

class PublicRscDocumentRequestConstraint
  def self.matches?(request)
    request.format.html? &&
      request.accepts.exclude?(Mime[:json]) &&
      request.headers["X-Inertia-Partial-Data"].blank?
  end
end
