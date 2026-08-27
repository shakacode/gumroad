# frozen_string_literal: true

class DiscoverDomainConstraint
  def self.matches?(request)
    return discover_request?(request) if benchmark_custom_root?(request.host)

    canonical_discover_host?(request.host) || control_plane_branch_discover_request?(request)
  end

  def self.canonical_discover_host?(host)
    host == VALID_DISCOVER_REQUEST_HOST
  end

  def self.control_plane_branch_host?(host)
    GumroadDomainConstraint.control_plane_branch_host?(host)
  end

  def self.control_plane_branch_discover_request?(request)
    return false unless control_plane_branch_host?(request.host)

    discover_request?(request)
  end

  def self.benchmark_custom_root?(host)
    ENV["CONTROL_PLANE_BENCHMARK"] == "true" && canonical_discover_host?(host)
  end

  def self.discover_request?(request)
    request.path != "/"
  end
  private_class_method :benchmark_custom_root?
  private_class_method :control_plane_branch_discover_request?
  private_class_method :control_plane_branch_host?
  private_class_method :discover_request?
end
