# frozen_string_literal: true

require "active_storage/service/s3_service"

class ActiveStorage::Service::PrefixedS3Service < ActiveStorage::Service::S3Service
  def initialize(prefix:, **options)
    @prefix = prefix.to_s.delete_prefix("/").delete_suffix("/")
    raise ArgumentError, "prefix must be present" if @prefix.blank?

    super(**options)
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
