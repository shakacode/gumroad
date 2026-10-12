# frozen_string_literal: true

# Allow requests from all origins to API domain
# Static benchmark assets already allow every origin; Rack::Cors would add Vary: Origin and defeat iframe reuse.
cors_insertion = Rails.env.benchmark? ? :insert_after : :insert_before
cors_position = Rails.env.benchmark? ? ActionDispatch::Static : 0
Rails.application.config.middleware.public_send(cors_insertion, cors_position, Rack::Cors) do
  public_profile_json_request = proc do |env|
    path = env["PATH_INFO"].to_s
    request = Rack::Request.new(env)
    host = request.host.presence

    if host.blank?
      false
    elsif path == "/.json"
      UserCustomDomainConstraint.matches?(request)
    else
      scheme = request.scheme.presence || PROTOCOL
      route_params = Rails.application.routes.recognize_path("#{scheme}://#{host}#{path}", method: :get)
      route_params[:controller] == "users" && route_params[:action] == "show" && route_params[:format] == "json"
    end
  rescue ActionController::RoutingError, URI::InvalidURIError
    false
  end

  allow do
    origins "*"
    resource "*",
             headers: :any,
             methods: [:get, :post, :put, :delete],
             if: proc { |env| VALID_API_REQUEST_HOSTS.include?(env["HTTP_HOST"]) }
  end

  allow do
    origins "*"
    resource "/l/*.json",
             headers: :any,
             methods: [:get]
    resource "/.json",
             headers: :any,
             methods: [:get],
             if: public_profile_json_request
    resource "/:username.json",
             headers: :any,
             methods: [:get],
             if: public_profile_json_request
  end

  allow do
    origins VALID_CORS_ORIGINS
    resource "/users/session_info",
             headers: :any,
             methods: [:get]
  end

  if Rails.env.development? || Rails.env.test? || Rails.env.benchmark?
    allow do
      origins "*"
      resource "/fonts/ABCFavorit-Regular*"
    end
  end

  if Rails.env.development? || Rails.env.benchmark?
    # Allow XHRs across *.localhost subdomains (e.g. localhost:3000 fetching
    # seller.localhost:3000) since each subdomain is its own browser origin.
    # In production the equivalent path doesn't run cross-origin in normal flows,
    # so this rule intentionally stays dev-only.
    allow do
      origins(/\Ahttps?:\/\/(?:[a-z0-9-]+\.)*localhost(?::\d+)?\z/)
      resource "*",
               headers: :any,
               methods: [:get, :post, :put, :patch, :delete, :options],
               credentials: true
    end
  end

  if ENV["CUSTOM_DOMAIN"].present?
    allow do
      origins ENV["CUSTOM_DOMAIN"]
      resource "*",
               headers: :any,
               methods: [:get, :post, :put, :patch, :delete, :options],
               credentials: true
    end
  end
end
