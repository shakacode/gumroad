# frozen_string_literal: true

class DiscoverDomainConstraint
  def self.matches?(request)
    request.host == VALID_DISCOVER_REQUEST_HOST ||
      GumroadDomainConstraint.control_plane_branch_host?(request.host) && request.path != "/"
  end
end
