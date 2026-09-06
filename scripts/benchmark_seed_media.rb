# frozen_string_literal: true

require "digest/md5"
require "uri"

module BenchmarkSeedMedia
  DELIVERY_VERSION = 1
  MEDIA_PATH = Rails.root.join("public/native-product-page-fixture")
  THUMBNAIL_DIMENSION = Thumbnail::DISPLAY_THUMBNAIL_DIMENSION

  extend CdnUrlHelper

  module_function
  def attach_thumbnail!(product:, filename:, uploaded_blobs:, replaced_blobs:)
    fixture_path = MEDIA_PATH.join(filename)
    source_checksum = Digest::MD5.file(fixture_path).base64digest
    thumbnail = product.thumbnail || product.build_thumbnail

    unless current_blob?(thumbnail.file.blob, filename:, source_checksum:, width: THUMBNAIL_DIMENSION, height: THUMBNAIL_DIMENSION)
      blob = uploaded_blobs.find do |candidate|
        current_blob?(candidate, filename:, source_checksum:, width: THUMBNAIL_DIMENSION, height: THUMBNAIL_DIMENSION)
      end
      blob ||= upload_blob!(
        io: fixture_path.open("rb"),
        filename:,
        content_type: content_type(filename),
        source_checksum:,
        width: THUMBNAIL_DIMENSION,
        height: THUMBNAIL_DIMENSION,
        uploaded_blobs:,
      )
      detach_for_replacement!(thumbnail.file, replaced_blobs:)
      thumbnail.file = blob
    end

    # Keep production WebP fixtures scoped to benchmarks without widening ordinary thumbnail uploads.
    thumbnail.assign_attributes(unsplash_url: nil, deleted_at: nil)
    thumbnail.save!(validate: false)
  end

  def active_storage_description(template:, previous_html:, uploaded_blobs:, replaced_blobs:)
    previous_sources = Nokogiri::HTML.fragment(previous_html.to_s).css("img").map { _1["src"] }
    fragment = Nokogiri::HTML.fragment(template)

    fragment.css("img").each_with_index do |image, index|
      filename = File.basename(URI(image["src"]).path)
      fixture_path = MEDIA_PATH.join(filename)
      source_checksum = Digest::MD5.file(fixture_path).base64digest
      width, height = image_dimensions(fixture_path)
      blob = blob_from_url(previous_sources[index])
      unless current_blob?(blob, filename:, source_checksum:, width:, height:)
        replaced_blob = blob
        blob = upload_blob!(
          io: fixture_path.open("rb"),
          filename:,
          content_type: content_type(filename),
          source_checksum:,
          width:,
          height:,
          uploaded_blobs:,
        )
        replaced_blobs << replaced_blob if managed_description_blob?(replaced_blob)
      end
      image["src"] = cdn_url_for(blob.url)
    end

    fragment.to_html
  end

  def detach_for_replacement!(attachment, replaced_blobs:)
    return unless attachment.attached?

    replaced_blobs << attachment.blob
    attachment.detach
  end

  def managed_description_blob?(blob)
    blob&.metadata&.fetch("benchmark_source_checksum", nil).present? && !blob.attachments.exists?
  end

  def blob_in_use?(blob)
    blob.attachments.exists? || Link.where("description LIKE ?", "%#{ActiveRecord::Base.sanitize_sql_like(blob.key)}%").exists?
  end

  def current_blob?(blob, filename:, source_checksum:, width:, height:)
    blob.present? &&
      blob.filename.to_s == filename &&
      blob.content_type == content_type(filename) &&
      blob.checksum == source_checksum &&
      blob.metadata["benchmark_source_checksum"] == source_checksum &&
      blob.metadata["benchmark_delivery_version"] == DELIVERY_VERSION &&
      blob.service_name == ActiveStorage::Blob.service.name.to_s &&
      blob.metadata["width"].to_i == width &&
      blob.metadata["height"].to_i == height &&
      ActiveStorage::Blob.service.exist?(blob.key)
  end

  def upload_blob!(io:, filename:, content_type:, source_checksum:, width:, height:, uploaded_blobs:)
    io.rewind
    blob = ActiveStorage::Blob.create_and_upload!(io:, filename:, content_type:, identify: false)
    uploaded_blobs << blob
    blob.update!(
      metadata: blob.metadata.merge(
        "identified" => true,
        "analyzed" => true,
        "benchmark_delivery_version" => DELIVERY_VERSION,
        "benchmark_source_checksum" => source_checksum,
        "width" => width,
        "height" => height,
      ),
    )
    blob
  ensure
    io.close if io.is_a?(File)
  end

  def blob_from_url(url)
    return if url.blank?

    key = URI(url).path.split("/").last
    ActiveStorage::Blob.find_by(key:)
  rescue URI::InvalidURIError
    nil
  end

  def image_dimensions(path)
    image = MiniMagick::Image.open(path.to_s)
    image.dimensions
  ensure
    image&.destroy!
  end

  def content_type(filename)
    return "image/webp" if filename.end_with?(".webp")
    return "image/png" if filename.end_with?(".png")

    "image/jpeg"
  end
end
