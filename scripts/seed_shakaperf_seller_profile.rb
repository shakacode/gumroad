# frozen_string_literal: true

# Seed the high-cardinality public profile used by ShakaPerf.
#
# Usage:
#   bin/rails runner scripts/seed_shakaperf_seller_profile.rb

module ShakaPerfSellerProfileSeed
  OWNER = "shakaperf-seller-profile"
  OWNER_KEY = "fixture_owner"
  VERSION = 1
  VERSION_KEY = "fixture_version"
  SELLER_EMAIL = "shakaperf-profile@example.com"
  SELLER_USERNAME = "shakaperfprofile"
  CREATED_AT = Time.utc(2026, 2, 1)
  MEDIA_PATH = Rails.root.join("public/native-product-page-fixture")
  COVER_FILES = %w[microsoft-365.png powershell.png purview.png power-platform.png].freeze

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

  module_function

  def run!
    ActiveRecord::Base.transaction do
      seller = seed_seller!
      products = []
      products.concat(seed_simple_products!(seller:))
      products.concat(seed_variant_products!(seller:))
      products.concat(seed_inventory_products!(seller:))
      components = seed_component_products!(seller:)
      products.concat(components)
      products.concat(seed_bundles!(seller:, components:))
      seed_profile!(seller:, products:)

      puts "Seeded ShakaPerf profile with #{products.size} products:"
      puts "http://#{SELLER_USERNAME}.localhost:#{ENV.fetch('DEV_LANE_PORT', '3000')}/"
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
    attach_avatar!(seller)
    seller
  end

  def attach_avatar!(seller)
    fixture = "luis-furushio-profile.png"
    return if seller.avatar.attached? && seller.avatar.filename.to_s == fixture

    blob = MEDIA_PATH.join(fixture).open("rb") do |file|
      ActiveStorage::Blob.create_and_upload!(io: file, filename: fixture, content_type: "image/png", identify: false)
    end
    blob.update!(metadata: blob.metadata.merge("identified" => true, "analyzed" => true, "width" => 400, "height" => 400))
    seller.avatar.attach(blob)
  end

  def seed_simple_products!(seller:)
    SIMPLE_NAMES.each_with_index.map do |name, index|
      seed_product!(seller:, type: "simple", index:, name:, max_purchase_count: 20 + index)
    end
  end

  def seed_variant_products!(seller:)
    VARIANT_NAMES.each_with_index.map do |name, index|
      product = seed_product!(seller:, type: "variant", index:, name:)
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

  def seed_inventory_products!(seller:)
    INVENTORY_NAMES.each_with_index.map do |name, index|
      seed_product!(seller:, type: "inventory", index:, name:, max_purchase_count: index.even? ? 8 : 0)
    end
  end

  def seed_component_products!(seller:)
    COMPONENT_NAMES.each_with_index.map do |name, index|
      seed_product!(seller:, type: "component", index:, name:, max_purchase_count: index == 3 ? 0 : 15)
    end
  end

  def seed_bundles!(seller:, components:)
    BUNDLE_NAMES.each_with_index.map do |name, index|
      bundle = seed_product!(seller:, type: "bundle", index:, name:, is_bundle: true)
      desired_ids = components.slice(index * 2, 2).each_with_index.map do |component, position|
        bundle_product = bundle.bundle_products.find_or_initialize_by(product: component)
        bundle_product.update!(position:, quantity: 1, deleted_at: nil)
        bundle_product.id
      end
      bundle.bundle_products.where.not(id: desired_ids).update_all(deleted_at: CREATED_AT)
      bundle
    end
  end

  def seed_product!(seller:, type:, index:, name:, max_purchase_count: nil, is_bundle: false)
    suffix = (65 + index).chr
    unique_permalink = "PROFILE#{type.upcase}#{suffix}"
    product = Link.find_by(unique_permalink:)
    if product && (product.user_id != seller.id || product.json_data[OWNER_KEY] != OWNER)
      raise "Refusing to overwrite non-fixture product with permalink #{unique_permalink.inspect}"
    end

    product ||= seller.links.build(unique_permalink:)
    product.assign_attributes(
      user: seller,
      custom_permalink: "profile-#{type}-#{suffix.downcase}",
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

    cover = COVER_FILES.fetch(product_position(type:, index:) % COVER_FILES.size)
    product.thumbnail || product.build_thumbnail
    product.thumbnail.update!(unsplash_url: "/native-product-page-fixture/#{cover}", deleted_at: nil)
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
end

ShakaPerfSellerProfileSeed.run!
