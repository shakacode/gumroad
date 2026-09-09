# frozen_string_literal: true

require "active_storage/service/s3_service"
require "uri"

class ActiveStorage::Service::PrefixedS3Service < ActiveStorage::Service::S3Service
  def initialize(prefix:, public_host:, **options)
    @prefix = prefix.to_s.delete_prefix("/").delete_suffix("/")
    raise ArgumentError, "prefix must be present" if @prefix.blank?
    @public_origin = URI::HTTPS.build(host: public_host).to_s.delete_suffix("/")

    super(**options)
  end

  def url(key, **)
    instrument :url, key: key do |payload|
      payload[:url] = "#{@public_origin}/#{prefixed_key(key)}"
    end
  end

  def delete_prefixed(prefix)
    super(prefixed_key(prefix))
  end

  private
    def object_for(key)
      bucket.object(prefixed_key(key))
    end

    def prefixed_key(key)
      "#{@prefix}/#{key.to_s.delete_prefix("/")}"
    end
end
