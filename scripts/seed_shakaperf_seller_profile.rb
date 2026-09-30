# frozen_string_literal: true

require "digest/md5"
require "digest/sha2"
require Rails.root.join("scripts/benchmark_seed_media").to_s

# Seed the high-cardinality public profile used by ShakaPerf.
#
# Usage:
#   bin/rails runner scripts/seed_shakaperf_seller_profile.rb

module ShakaPerfSellerProfileSeed
  ALLOWED_ENVIRONMENTS = %w[development test benchmark].freeze
  OWNER = "shakaperf-seller-profile"
  OWNER_KEY = "fixture_owner"
  VERSION = 2
  VERSION_KEY = "fixture_version"
  SELLER_EMAIL = "shakaperf-profile@example.com"
  SELLER_USERNAME = ENV.fetch("BENCHMARK_SELLER_USERNAME", "shakaperfprofile")
  CREATED_AT = Time.utc(2026, 2, 1)
  MEDIA_PATH = Rails.root.join("public/native-product-page-fixture")
  THUMBNAIL_FILES = %w[
    microsoft-365-thumbnail.webp
    powershell-thumbnail.webp
    purview-thumbnail.webp
    power-platform-thumbnail.webp
  ].freeze

  SIMPLE_NAMES = [
    "Tenant Operations Handbook",
    "Identity Architecture Field Notes",
    "Teams Administration Playbook",
    "SharePoint Governance Templates",
    "Exchange Online Runbooks",
    "Security Baseline Workbook",
    "Incident Response Checklists",
    "Cloud Migration Planning Kit",
  ].freeze
  VARIANT_NAMES = [
    "Automation Patterns Library",
    "Compliance Workshop Recording",
    "Power Platform Starter Course",
    "Microsoft Graph Recipe Book",
  ].freeze
  INVENTORY_NAMES = [
    "Live Architecture Review",
    "Tenant Audit Session",
    "Migration Office Hours",
    "Security Design Clinic",
  ].freeze
  COMPONENT_NAMES = [
    "Bundle Component: Identity",
    "Bundle Component: Collaboration",
    "Bundle Component: Automation",
    "Bundle Component: Compliance",
  ].freeze
  BUNDLE_NAMES = ["Microsoft 365 Operations Collection", "Automation and Compliance Collection"].freeze
  CATALOG_DIGEST = "b04efa6a560d21f81e2103ee22a45805f0676b9631636da9ed4b093c4ded1dd5"
  FIXTURE_SHA256 = {
    "luis-furushio-profile.webp" => "b2f42b911f5d994e022dab455f2c893dd0478765d00981f86986546af22aaf92",
    "microsoft-365-thumbnail.webp" => "3cc2cb097f64d1708cc1d7c4f549963b6d9037e044b217612f088531b6ddec48",
    "powershell-thumbnail.webp" => "86c77ec52356f1ca982cb45f7e58aa7c2aff4cc1664615b3b3f4ae7eb18baef6",
    "purview-thumbnail.webp" => "b334d6d9fec1c74b06cd3c6d1f7c765924f161581d58f072247e185329f662b5",
    "power-platform-thumbnail.webp" => "dd34f4790224f651de84b08d4e869afde690ae9c12270edb0539cfba6c70ab81",
  }.freeze

  module_function

  def run!
    uploaded_blobs = []
    replaced_blobs = []
    unless Rails.env.in?(ALLOWED_ENVIRONMENTS)
      raise "ShakaPerf seller profile seed may only run in development, test, or benchmark"
    end
    validate_fixture_hashes!
    raise "ShakaPerf seller profile catalog definition changed" unless catalog_digest == CATALOG_DIGEST

    ActiveRecord::Base.transaction do
      seller = seed_seller!(uploaded_blobs:, replaced_blobs:)
      products = []
      products.concat(seed_simple_products!(seller:, uploaded_blobs:, replaced_blobs:))
      products.concat(seed_variant_products!(seller:, uploaded_blobs:, replaced_blobs:))
      products.concat(seed_inventory_products!(seller:, uploaded_blobs:, replaced_blobs:))
      components = seed_component_products!(seller:, uploaded_blobs:, replaced_blobs:)
      products.concat(components)
      products.concat(seed_bundles!(seller:, components:, uploaded_blobs:, replaced_blobs:))
      seed_profile!(seller:, products:)

      puts "Seeded ShakaPerf profile with #{products.size} products:"
      puts "#{PROTOCOL}://#{SELLER_USERNAME}.#{ROOT_DOMAIN}/"
    end
    uploaded_blobs.clear
    purge_replaced_blobs(replaced_blobs)
  rescue
    delete_uploaded_blobs(uploaded_blobs)
    raise
  end

  def seed_seller!(uploaded_blobs:, replaced_blobs:)
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
      name: "ShakaPerf Microsoft 365 Lab",
      username: SELLER_USERNAME,
      bio: "Production-shaped guides, workshops, and bundles for measuring high-cardinality public profiles.",
      user_risk_state: "compliant",
      confirmed_at: CREATED_AT,
      payment_address: SELLER_EMAIL,
    )
    seller.json_data[OWNER_KEY] = OWNER
    seller.json_data[VERSION_KEY] = VERSION
    seller.password = SecureRandom.hex(24) if seller.new_record?
    seller.save!
    attach_avatar!(seller, uploaded_blobs:, replaced_blobs:)
    seller
  end

  def attach_avatar!(seller, uploaded_blobs:, replaced_blobs:)
    fixture = "luis-furushio-profile.webp"
    fixture_path = MEDIA_PATH.join(fixture)
    return if seller.avatar.attached? &&
      seller.avatar.filename.to_s == fixture &&
      seller.avatar.content_type == "image/webp" &&
      seller.avatar.blob.checksum == Digest::MD5.file(fixture_path).base64digest &&
      seller.avatar.blob.metadata["benchmark_delivery_version"] == BenchmarkSeedMedia::DELIVERY_VERSION &&
      seller.avatar.blob.service_name == ActiveStorage::Blob.service.name.to_s &&
      seller.avatar.blob.service.exist?(seller.avatar.blob.key)

    blob = fixture_path.open("rb") do |file|
      ActiveStorage::Blob.create_and_upload!(io: file, filename: fixture, content_type: "image/webp", identify: false)
    end
    uploaded_blobs << blob
    blob.update!(
      metadata: blob.metadata.merge(
        "identified" => true,
        "analyzed" => true,
        "benchmark_delivery_version" => BenchmarkSeedMedia::DELIVERY_VERSION,
        "width" => 400,
        "height" => 400,
      ),
    )
    # Keep the production WebP fixture scoped to benchmarks without widening ordinary avatar uploads.
    BenchmarkSeedMedia.detach_for_replacement!(seller.avatar, replaced_blobs:)
    seller.avatar = blob
    seller.save!(validate: false)
  end

  def delete_uploaded_blobs(uploaded_blobs)
    # The database rollback removes blob rows, but remote objects need explicit cleanup.
    uploaded_blobs.each do |blob|
      next if ActiveStorage::Blob.exists?(blob.id)

      blob.delete
    rescue StandardError
      warn "Failed to delete an uploaded seller profile fixture after rollback"
    end
  end

  def purge_replaced_blobs(replaced_blobs)
    current_service_name = ActiveStorage::Blob.service.name.to_s
    replaced_blobs.each do |blob|
      next if BenchmarkSeedMedia.blob_in_use?(blob)

      blob.delete if blob.service_name == current_service_name
      blob.destroy!
    end
  end

  def seed_simple_products!(seller:, uploaded_blobs:, replaced_blobs:)
    SIMPLE_NAMES.each_with_index.map do |name, index|
      seed_product!(seller:, type: "simple", index:, name:, max_purchase_count: 20 + index, uploaded_blobs:, replaced_blobs:)
    end
  end

  def seed_variant_products!(seller:, uploaded_blobs:, replaced_blobs:)
    VARIANT_NAMES.each_with_index.map do |name, index|
      product = seed_product!(seller:, type: "variant", index:, name:, uploaded_blobs:, replaced_blobs:)
      category = product.variant_categories.find_or_initialize_by(title: "Edition")
      category.update!(deleted_at: nil)
      %w[Standard Extended].each_with_index do |variant_name, variant_index|
        variant = category.variants.find_or_initialize_by(name: variant_name)
        available = index.even? && variant_index.zero?
        variant.update!(
          price_difference_cents: variant_index * 500,
          position_in_category: variant_index,
          max_purchase_count: available ? 12 : 0,
          deleted_at: nil,
          created_at: CREATED_AT + variant_index.seconds,
        )
      end
      product
    end
  end

  def seed_inventory_products!(seller:, uploaded_blobs:, replaced_blobs:)
    INVENTORY_NAMES.each_with_index.map do |name, index|
      seed_product!(seller:, type: "inventory", index:, name:, max_purchase_count: index.even? ? 8 : 0, uploaded_blobs:, replaced_blobs:)
    end
  end

  def seed_component_products!(seller:, uploaded_blobs:, replaced_blobs:)
    COMPONENT_NAMES.each_with_index.map do |name, index|
      seed_product!(seller:, type: "component", index:, name:, max_purchase_count: index == 3 ? 0 : 15, uploaded_blobs:, replaced_blobs:)
    end
  end

  def seed_bundles!(seller:, components:, uploaded_blobs:, replaced_blobs:)
    BUNDLE_NAMES.each_with_index.map do |name, index|
      bundle = seed_product!(seller:, type: "bundle", index:, name:, is_bundle: true, uploaded_blobs:, replaced_blobs:)
      desired_ids = components.slice(index * 2, 2).each_with_index.map do |component, position|
        bundle_product = bundle.bundle_products.find_or_initialize_by(product: component)
        bundle_product.update!(position:, quantity: 1, deleted_at: nil)
        bundle_product.id
      end
      bundle.bundle_products.where.not(id: desired_ids).update_all(deleted_at: CREATED_AT)
      bundle
    end
  end

  def seed_product!(seller:, type:, index:, name:, uploaded_blobs:, replaced_blobs:, max_purchase_count: nil, is_bundle: false)
    suffix = (65 + index).chr
    unique_permalink = "PROFILE#{type.upcase}#{suffix}"
    custom_permalink = "profile-#{type}-#{suffix.downcase}"
    product = Link.find_by(unique_permalink:)
    product_by_general_permalink = Link.by_general_permalink(custom_permalink).order(created_at: :asc, id: :asc).first
    if product && product_by_general_permalink && product.id != product_by_general_permalink.id
      raise "Refusing to claim permalink #{custom_permalink.inspect} already used by product #{product_by_general_permalink.id}"
    end
    product ||= product_by_general_permalink
    if product && (product.user_id != seller.id || product.json_data[OWNER_KEY] != OWNER)
      raise "Refusing to overwrite non-fixture product with permalink #{unique_permalink.inspect}"
    end

    product ||= seller.links.build(unique_permalink:)
    product.assign_attributes(
      user: seller,
      custom_permalink:,
      name:,
      description: "A deterministic #{type} product for the public profile benchmark.",
      filetype: "pdf",
      native_type: Link::NATIVE_TYPE_DIGITAL,
      taxonomy: Taxonomy.find_by!(slug: "software-development"),
      price_cents: 900 + (index * 100),
      created_at: CREATED_AT - product_position(type:, index:).minutes,
      display_product_reviews: true,
      draft: false,
      purchase_disabled_at: nil,
      deleted_at: nil,
      hide_sold_out_variants: true,
      max_purchase_count:,
      is_bundle:,
    )
    product.json_data[OWNER_KEY] = OWNER
    product.json_data[VERSION_KEY] = VERSION
    product.save!

    thumbnail = THUMBNAIL_FILES.fetch(product_position(type:, index:) % THUMBNAIL_FILES.size)
    BenchmarkSeedMedia.attach_thumbnail!(product:, filename: thumbnail, uploaded_blobs:, replaced_blobs:)
    seed_rating!(product:, index: product_position(type:, index:))
    product.reload
  end

  def seed_rating!(product:, index:)
    five_star_count = 8 + (index % 5)
    four_star_count = 1 + (index % 2)
    stat = ProductReviewStat.find_or_initialize_by(link: product)
    stat.update!(
      reviews_count: five_star_count + four_star_count,
      average_rating: ((five_star_count * 5.0 + four_star_count * 4) / (five_star_count + four_star_count)).round(1),
      ratings_of_one_count: 0,
      ratings_of_two_count: 0,
      ratings_of_three_count: 0,
      ratings_of_four_count: four_star_count,
      ratings_of_five_count: five_star_count,
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    )
  end

  def seed_profile!(seller:, products:)
    section = seller.seller_profile_sections.find_or_initialize_by(
      type: "SellerProfileProductsSection",
      header: "Microsoft 365 Lab",
      product_id: nil,
    )
    section.update!(
      json_data: {
        "default_product_sort" => ProductSortKey::PAGE_LAYOUT,
        "shown_products" => products.map(&:id),
        "show_filters" => true,
        "add_new_products" => false,
      },
    )
    seller.seller_profile_sections.on_profile.where.not(id: section.id).delete_all
    profile = SellerProfile.find_or_initialize_by(seller:)
    profile.update!(json_data: { "tabs" => [{ "name" => "Products", "sections" => [section.id] }] })
  end

  def product_position(type:, index:)
    offsets = { "simple" => 0, "variant" => 8, "inventory" => 12, "component" => 16, "bundle" => 20 }
    offsets.fetch(type) + index
  end

  def catalog_digest
    names = [SIMPLE_NAMES, VARIANT_NAMES, INVENTORY_NAMES, COMPONENT_NAMES, BUNDLE_NAMES].flatten
    Digest::SHA256.hexdigest(names.join("\0"))
  end

  def validate_fixture_hashes!
    FIXTURE_SHA256.each do |filename, expected|
      actual = Digest::SHA256.file(MEDIA_PATH.join(filename)).hexdigest
      raise "Fixture checksum mismatch for #{filename}" unless actual == expected
    end
  end
end

ShakaPerfSellerProfileSeed.run!
