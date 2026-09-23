# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Use tld_length 3 in staging to support subdomains like username.staging.gumroad.com
tld_length = Rails.env.staging? ? 3 : 2
expire_after = Rails.env.test? ? 10.years : 1.month
domain = :all

base_cookie_name = "_gumroad_app_session"
session_cookie_name =
  case Rails.env.to_sym
  when :production
    base_cookie_name
  when :staging
    if ENV["BRANCH_DEPLOYMENT"].present?
      domain = ".#{DOMAIN}"
      "#{base_cookie_name}_#{Digest::SHA256.hexdigest(DOMAIN)[0..31]}"
    else
      "#{base_cookie_name}_staging"
    end
  when :development
    "#{base_cookie_name}_development"
  when :benchmark
    domain = ENV.key?("SESSION_COOKIE_DOMAIN") ? ENV["SESSION_COOKIE_DOMAIN"].presence : :all
    "#{base_cookie_name}_benchmark"
  else
    "#{base_cookie_name}_#{Rails.env}"
  end

Rails.application.config.session_store :cookie_store,
                                       key: session_cookie_name,
                                       secure: ENV.fetch("SESSION_COOKIE_SECURE", Rails.env.production?.to_s) == "true",
                                       domain:,
                                       expire_after:,
                                       tld_length:
