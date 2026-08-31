# frozen_string_literal: true

require "digest/md5"
require "image_processing/mini_magick"
require "uri"

module BenchmarkSeedMedia
  MEDIA_PATH = Rails.root.join("public/native-product-page-fixture")
  THUMBNAIL_DIMENSION = Thumbnail::DISPLAY_THUMBNAIL_DIMENSION

  extend CdnUrlHelper

  module_function
  def attach_thumbnail!(product:, filename:, uploaded_blobs:)
    fixture_path = MEDIA_PATH.join(filename)
    processed_file = ImageProcessing::MiniMagick
      .source(fixture_path)
      .resize_to_fill(THUMBNAIL_DIMENSION, THUMBNAIL_DIMENSION)
      .call
    source_checksum = Digest::MD5.file(fixture_path).base64digest
    thumbnail = product.thumbnail || product.build_thumbnail

    unless current_blob?(thumbnail.file.blob, filename:, source_checksum:, width: THUMBNAIL_DIMENSION, height: THUMBNAIL_DIMENSION)
      blob = uploaded_blobs.find do |candidate|
        current_blob?(candidate, filename:, source_checksum:, width: THUMBNAIL_DIMENSION, height: THUMBNAIL_DIMENSION)
      end
      blob ||= upload_blob!(
        io: processed_file,
        filename:,
        content_type: content_type(filename),
        source_checksum:,
        width: THUMBNAIL_DIMENSION,
        height: THUMBNAIL_DIMENSION,
        uploaded_blobs:,
      )
      thumbnail.file.attach(blob)
    end

    thumbnail.update!(unsplash_url: nil, deleted_at: nil)
  ensure
    processed_file&.close!
  end

  def active_storage_description(template:, previous_html:, uploaded_blobs:)
    previous_sources = Nokogiri::HTML.fragment(previous_html.to_s).css("img").map { _1["src"] }
    fragment = Nokogiri::HTML.fragment(template)

    fragment.css("img").each_with_index do |image, index|
      filename = File.basename(URI(image["src"]).path)
      fixture_path = MEDIA_PATH.join(filename)
      source_checksum = Digest::MD5.file(fixture_path).base64digest
      width, height = image_dimensions(fixture_path)
      blob = blob_from_url(previous_sources[index])
      unless current_blob?(blob, filename:, source_checksum:, width:, height:)
        blob = upload_blob!(
          io: fixture_path.open("rb"),
          filename:,
          content_type: content_type(filename),
          source_checksum:,
          width:,
          height:,
          uploaded_blobs:,
        )
      end
      image["src"] = cdn_url_for(blob.url)
    end

    fragment.to_html
  end

  def current_blob?(blob, filename:, source_checksum:, width:, height:)
    blob.present? &&
      blob.filename.to_s == filename &&
      blob.metadata["benchmark_source_checksum"] == source_checksum &&
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
    filename.end_with?(".png") ? "image/png" : "image/jpeg"
  end
end
