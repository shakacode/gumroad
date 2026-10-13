# frozen_string_literal: true

class GumroadDomainConstraint
  CONTROL_PLANE_RAILS_HOST = /\Arails-[a-z0-9-]+(?:\.cpln\.app|(?:\.[a-z0-9-]+)*\.controlplane\.us)\z/

  def self.matches?(request)
    VALID_REQUEST_HOSTS.include?(request.host) || control_plane_branch_host?(request.host)
  end

  def self.control_plane_branch_host?(host)
    Rails.env.benchmark? && ENV["CONTROL_PLANE_BENCHMARK"] == "true" &&
      ENV["BRANCH_DEPLOYMENT"].present? && CONTROL_PLANE_RAILS_HOST.match?(host)
  end
end
