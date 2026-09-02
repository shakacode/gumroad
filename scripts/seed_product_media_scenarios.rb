# frozen_string_literal: true

require "digest/md5"
require "digest/sha2"

# Seed a compact, deterministic catalog for product-media development and AB tests.
#
# Usage:
#   bin/rails runner scripts/seed_product_media_scenarios.rb
#
# The checked-in files are the same fixtures exercised by the Thumbnail,
# AssetPreview, and ProductFile factories. Keeping this runner independent of
# FactoryBot lets it run in development and benchmark environments where the
# test bundle is not installed.

module ProductMediaScenariosSeed
  ALLOWED_ENVIRONMENTS = %w[development test benchmark].freeze
  OWNER = "product-media-scenarios"
  OWNER_KEY = "fixture_owner"
  VERSION = 1
  VERSION_KEY = "fixture_version"
  SELLER_EMAIL = "media-scenarios@example.com"
  SELLER_USERNAME = "mediascenarios"
  LOCAL_PORT = ENV.fetch("DEV_LANE_PORT", "3000")
  FIXTURES_PATH = Rails.root.join("spec/support/fixtures")

  PRODUCT_DEFINITIONS = [
    {
      unique_permalink: "mediagallery",
      name: "Media gallery bundle",
      description: <<~HTML,
        <h2>Every product-page media type in one place</h2>
        <p>Use the cover carousel to test a static image, animated GIF, uploaded video, and embedded video without switching products.</p>
        <p>The purchase includes an audio track, a streamable video, and a PDF guide for download-page and library scenarios.</p>
      HTML
      price_cents: 1_500,
      native_type: Link::NATIVE_TYPE_DIGITAL,
      thumbnail: "smilie.png",
      previews: [
        { type: :file, fixture: "kFDzu.png" },
        { type: :file, fixture: "sample.gif" },
        { type: :file, fixture: "thing.mov" },
        { type: :youtube },
      ],
      product_files: [
        {
          fixture: "magic.mp3",
          display_name: "Sample audio track",
          metadata: { size: 466_312, duration: 46, bitrate: 80_370 },
        },
        {
          fixture: "Big Buck Bunny - Trailer.mp4",
          display_name: "Sample streamable video",
          metadata: { size: 1_046_987, duration: 10, bitrate: 837_589, width: 1_920, height: 1_080, framerate: 60 },
        },
        {
          fixture: "billion-dollar-company-chapter-0.pdf",
          display_name: "Sample PDF guide",
          metadata: { size: 111_237, pagelength: 6 },
        },
      ],
    },
    {
      unique_permalink: "mediamembership",
      name: "Video course membership",
      description: <<~HTML,
        <h2>A recurring product with member content</h2>
        <p>Use this product to test monthly checkout, membership presentation, image covers, and embedded lesson media.</p>
      HTML
      price_cents: 800,
      native_type: Link::NATIVE_TYPE_MEMBERSHIP,
      recurring: true,
      thumbnail: "Austin's Mojo.png",
      previews: [{ type: :file, fixture: "autumn-leaves-1280x720.jpeg" }],
      rich_content: true,
      product_files: [],
    },
  ].freeze

  FILE_METADATA = {
    "smilie.png" => { content_type: "image/png", width: 1_006, height: 1_006 },
    "Austin's Mojo.png" => { content_type: "image/png", width: 1_006, height: 1_006 },
    "kFDzu.png" => { content_type: "image/png", width: 1_633, height: 512 },
    "sample.gif" => { content_type: "image/gif", width: 670, height: 500 },
    "thing.mov" => { content_type: "video/quicktime", width: 1_396, height: 958, duration: 2.003167, video: true, audio: false },
    "autumn-leaves-1280x720.jpeg" => { content_type: "image/jpeg", width: 1_280, height: 723 },
  }.freeze

  YOUTUBE_OEMBED = {
    "html" => '<iframe width="356" height="200" src="https://www.youtube.com/embed/qKebcV1jv3A?feature=oembed&showinfo=0&controls=0&rel=0" frameborder="0" allowfullscreen></iframe>',
    "info" => {
      "height" => 200,
      "width" => 356,
      "thumbnail_url" => "https://i.ytimg.com/vi/qKebcV1jv3A/hqdefault.jpg",
    },
    "url" => "https://www.youtube.com/watch?v=qKebcV1jv3A",
  }.freeze

  module_function

  def run!
    unless Rails.env.in?(ALLOWED_ENVIRONMENTS)
      raise "Product media scenarios may only run in development, test, or benchmark"
    end

    seller = seed_seller!
    products = PRODUCT_DEFINITIONS.map { |definition| seed_product!(seller:, definition:) }
    seed_profile!(seller:, products:)

    puts "Seeded #{products.size} media scenario products for #{seller.email}:"
    products.each do |product|
      puts "http://#{seller.username}.localhost:#{LOCAL_PORT}/l/#{product.general_permalink}"
    end
  end

  def seed_seller!
    seller = User.find_by(email: SELLER_EMAIL)
    if seller && seller.json_data[OWNER_KEY] != OWNER
      raise "Refusing to overwrite non-fixture user with email #{SELLER_EMAIL.inspect}"
    end
    username_owner = User.find_by(username: SELLER_USERNAME)
    if username_owner && username_owner != seller
      raise "Refusing to claim username #{SELLER_USERNAME.inspect} already used by user #{username_owner.id}"
    end

    seller ||= User.new(email: SELLER_EMAIL)
    seller.assign_attributes(
      name: "Media Scenarios",
      username: SELLER_USERNAME,
      bio: "A deterministic catalog for testing product images, playback, downloads, and recurring checkout.",
      user_risk_state: "compliant",
      confirmed_at: seller.confirmed_at || Time.current,
      payment_address: SELLER_EMAIL,
    )
    seller.json_data[OWNER_KEY] = OWNER
    seller.json_data[VERSION_KEY] = VERSION
    seller.password = SecureRandom.hex(24) if seller.new_record?
    seller.save!
    seller
  end

  def seed_product!(seller:, definition:)
    permalink = definition.fetch(:unique_permalink)
    product = Link.find_by(unique_permalink: permalink)
    product_by_general_permalink = Link.by_general_permalink(permalink).order(created_at: :asc, id: :asc).first
    if product && product_by_general_permalink && product.id != product_by_general_permalink.id
      raise "Refusing to claim permalink #{permalink.inspect} already used by product #{product_by_general_permalink.id}"
    end
    product ||= product_by_general_permalink
    if product && (product.user_id != seller.id || product.json_data[OWNER_KEY] != OWNER)
      raise "Refusing to overwrite non-fixture product with permalink #{permalink.inspect}"
    end

    product ||= seller.links.build(unique_permalink: permalink)
    recurring = definition.fetch(:recurring, false)
    product.assign_attributes(
      user: seller,
      name: definition.fetch(:name),
      description: definition.fetch(:description),
      filetype: "link",
      native_type: definition.fetch(:native_type),
      price_cents: definition.fetch(:price_cents),
      display_product_reviews: true,
      draft: false,
      purchase_disabled_at: nil,
      deleted_at: nil,
      is_recurring_billing: recurring,
      is_tiered_membership: recurring,
      subscription_duration: recurring ? :monthly : nil,
    )
    product.json_data[OWNER_KEY] = OWNER
    product.json_data[VERSION_KEY] = VERSION
    product.save!

    seed_thumbnail!(product:, fixture: definition.fetch(:thumbnail))
    seed_previews!(product:, definitions: definition.fetch(:previews))
    seed_product_files!(product:, definitions: definition.fetch(:product_files))
    seed_rich_content!(product:) if definition[:rich_content]
    product.reload
  end

  def seed_thumbnail!(product:, fixture:)
    thumbnail = Thumbnail.find_or_initialize_by(product:)
    attach_fixture!(attachment: thumbnail.file, fixture:) unless attachment_matches?(thumbnail.file, fixture)
    thumbnail.update!(unsplash_url: nil, deleted_at: nil)
  end

  def seed_previews!(product:, definitions:)
    desired_guids = definitions.each_with_index.map do |definition, index|
      guid = "media-scenario-#{product.unique_permalink}-#{index + 1}"
      preview = product.asset_previews.find_or_initialize_by(guid:)

      case definition.fetch(:type)
      when :file
        fixture = definition.fetch(:fixture)
        attach_fixture!(attachment: preview.file, fixture:) unless attachment_matches?(preview.file, fixture)
        preview.assign_attributes(unsplash_url: nil, oembed: nil)
      when :youtube
        preview.file.purge if preview.file.attached?
        preview.assign_attributes(unsplash_url: nil, oembed: YOUTUBE_OEMBED)
      else
        raise "Unknown preview type: #{definition.fetch(:type).inspect}"
      end

      preview.update!(position: index, deleted_at: nil)
      guid
    end

    product.asset_previews.alive.where.not(guid: desired_guids).update_all(deleted_at: Time.current)
  end

  def attach_fixture!(attachment:, fixture:)
    attachment.purge if attachment.attached?
    metadata = FILE_METADATA.fetch(fixture)
    blob = fixture_path(fixture).open("rb") do |file|
      ActiveStorage::Blob.create_and_upload!(
        io: file,
        filename: fixture,
        content_type: metadata.fetch(:content_type),
        identify: false,
      )
    end
    blob.update!(
      metadata: blob.metadata.merge(
        metadata.except(:content_type).stringify_keys,
        "identified" => true,
        "analyzed" => true,
      ),
    )
    attachment.attach(blob)
  end

  def attachment_matches?(attachment, fixture)
    attachment.attached? &&
      attachment.filename.to_s == fixture &&
      attachment.blob.checksum == Digest::MD5.file(fixture_path(fixture)).base64digest
  end

  def seed_product_files!(product:, definitions:)
    desired_urls = definitions.each_with_index.map do |definition, index|
      fixture = definition.fetch(:fixture)
      s3_key = "attachments/product_media_scenarios/#{product.unique_permalink}/#{fixture}"
      object = Aws::S3::Resource.new.bucket(S3_BUCKET).object(s3_key)
      object.upload_file(fixture_path(fixture).to_s) unless object_matches_fixture?(object, fixture)

      url = "#{S3_BASE_URL}#{s3_key}"
      product_file = product.product_files.find_or_initialize_by(url:)
      product_file.assign_attributes(
        display_name: definition.fetch(:display_name),
        position: index,
        deleted_at: nil,
        **definition.fetch(:metadata),
      )
      product_file.save!
      url
    end

    product.product_files.alive.where.not(url: desired_urls).update_all(deleted_at: Time.current)
  end

  def seed_rich_content!(product:)
    page = product.alive_rich_contents.find_or_initialize_by(title: "Welcome lesson")
    page.update!(
      description: [
        { "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Welcome to the member video library." }] },
        {
          "type" => "mediaEmbed",
          "attrs" => {
            "url" => YOUTUBE_OEMBED.fetch("url"),
            "title" => "Sample member lesson",
            "html" => YOUTUBE_OEMBED.fetch("html"),
          },
        },
      ],
      deleted_at: nil,
    )
  end

  def seed_profile!(seller:, products:)
    section = seller.seller_profile_sections.find_or_initialize_by(
      type: "SellerProfileProductsSection",
      header: "Media scenarios",
      product_id: nil,
    )
    section.update!(
      json_data: {
        "default_product_sort" => ProductSortKey::NEWEST,
        "shown_products" => products.map(&:id),
        "show_filters" => false,
        "add_new_products" => true,
      },
    )

    profile = SellerProfile.find_or_initialize_by(seller:)
    profile.update!(json_data: { "tabs" => [{ "name" => "Products", "sections" => [section.id] }] })
  end

  def fixture_path(fixture)
    FIXTURES_PATH.join(fixture).tap do |path|
      raise "Missing media fixture: #{path}" unless path.file?
    end
  end

  def object_matches_fixture?(object, fixture)
    object.exists? &&
      Digest::SHA256.hexdigest(object.get.body.read) == Digest::SHA256.file(fixture_path(fixture)).hexdigest
  end
end

ProductMediaScenariosSeed.run!
