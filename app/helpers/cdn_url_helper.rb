# frozen_string_literal: true

module CdnUrlHelper
  def storage_url_for(file)
    if Rails.env.benchmark?
      return Rails.application.routes.url_helpers.rails_storage_proxy_path(file, only_path: true)
    end

    file.url
  end

  def replace_s3_urls_with_cdn_urls(content)
    return content if content.blank?
    CDN_URL_MAP.each do |origin_regex, cdn_prefix|
      content = content.gsub(origin_regex, cdn_prefix)
    end

    content
  end
  alias cdn_url_for replace_s3_urls_with_cdn_urls
end
