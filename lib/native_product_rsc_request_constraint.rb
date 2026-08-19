# frozen_string_literal: true

class NativeProductRscRequestConstraint
  def self.matches?(request)
    NativePublicRscRequestConstraint.matches?(request) &&
      request.params["layout"] == Product::Layout::DISCOVER
  end
end
