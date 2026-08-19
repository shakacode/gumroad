# frozen_string_literal: true

# Seed the deterministic category and search result set used by ShakaPerf.
#
# Usage:
#   bin/rails runner scripts/seed_shakaperf_discover.rb

module ShakaPerfDiscoverSeed
  OWNER = "shakaperf-discover"
  OWNER_KEY = "fixture_owner"
  VERSION = 1
  VERSION_KEY = "fixture_version"
  PRODUCT_COUNT = 24
  CREATED_AT = Time.utc(2026, 3, 1)
  TAXONOMY_SLUG = "programming"
  SEARCH_QUERY = "ShakaPerf"
  COVER_FILES = %w[microsoft-365.png powershell.png purview.png power-platform.png].freeze
  SELLERS = [
    { email: "shakaperf-discover-a@example.com", username: "shakaperfdiscovera", name: "ShakaPerf Code Studio" },
    { email: "shakaperf-discover-b@example.com", username: "shakaperfdiscoverb", name: "ShakaPerf Automation Lab" },
    { email: "shakaperf-discover-c@example.com", username: "shakaperfdiscoverc", name: "ShakaPerf Systems Press" },
    { email: "shakaperf-discover-d@example.com", username: "shakaperfdiscoverd", name: "ShakaPerf Developer School" },
  ].freeze

  module_function

  def run!
    ActiveRecord::Base.transaction do
      sellers = SELLERS.map { seed_user!(**_1) }
      buyer = seed_user!(
        email: "shakaperf-discover-buyer@example.com",
        username: "shakaperfbuyer",
        name: "ShakaPerf Discover Buyer",
      )
      taxonomy = Taxonomy.find_by!(slug: TAXONOMY_SLUG, parent: Taxonomy.find_by!(slug: "software-development"))
      products = PRODUCT_COUNT.times.map do |index|
        seed_product!(seller: sellers.fetch(index % sellers.size), buyer:, taxonomy:, index:)
      end

      puts "Seeded #{products.size} ShakaPerf Discover products:"
      puts "http://localhost:#{ENV.fetch('DEV_LANE_PORT', '3000')}/software-development/programming"
      puts "http://localhost:#{ENV.fetch('DEV_LANE_PORT', '3000')}/discover?query=#{SEARCH_QUERY}"
    end
  end

  def seed_user!(email:, username:, name:)
    user = User.find_by(email:)
    if user && user.json_data[OWNER_KEY] != OWNER
      raise "Refusing to overwrite non-fixture user with email #{email.inspect}"
    end
    username_owner = User.find_by(username:)
    if username_owner && username_owner != user
      raise "Refusing to claim username #{username.inspect} already used by user #{username_owner.id}"
    end

    user ||= User.new(email:)
    user.assign_attributes(
      name:,
      username:,
      user_risk_state: "compliant",
      confirmed_at: CREATED_AT,
      payment_address: email,
    )
    user.json_data[OWNER_KEY] = OWNER
    user.json_data[VERSION_KEY] = VERSION
    user.password = SecureRandom.hex(24) if user.new_record?
    user.save!
    user
  end

  def seed_product!(seller:, buyer:, taxonomy:, index:)
    suffix = (65 + index).chr
    unique_permalink = "DISCOVER#{suffix}"
    product = Link.find_by(unique_permalink:)
    if product && (product.user_id != seller.id || product.json_data[OWNER_KEY] != OWNER)
      raise "Refusing to overwrite non-fixture product with permalink #{unique_permalink.inspect}"
    end

    product ||= seller.links.build(unique_permalink:)
    product.assign_attributes(
      user: seller,
      custom_permalink: "shakaperf-programming-#{index + 1}",
      name: format("ShakaPerf Programming Kit %02d", index + 1),
      description: "A deterministic ShakaPerf benchmark product for programming category and search rendering.",
      filetype: "pdf",
      native_type: Link::NATIVE_TYPE_DIGITAL,
      taxonomy:,
      price_cents: 1_000 + (index * 75),
      created_at: CREATED_AT - index.minutes,
      display_product_reviews: true,
      draft: false,
      purchase_disabled_at: nil,
      deleted_at: nil,
    )
    product.json_data[OWNER_KEY] = OWNER
    product.json_data[VERSION_KEY] = VERSION
    product.save!
    product.save_tags!(["shakaperf", "programming"])

    cover = COVER_FILES.fetch(index % COVER_FILES.size)
    product.thumbnail || product.build_thumbnail
    product.thumbnail.update!(unsplash_url: "/native-product-page-fixture/#{cover}", deleted_at: nil)
    seed_rating!(product:, index:)
    seed_sale!(product:, seller:, buyer:, index:)
    product.reload
  end

  def seed_rating!(product:, index:)
    five_star_count = 12 + (index % 7)
    four_star_count = 2 + (index % 3)
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

  def seed_sale!(product:, seller:, buyer:, index:)
    purchased_at = CREATED_AT + index.minutes
    purchase = Purchase.find_or_initialize_by(link_id: product.id, purchaser_id: buyer.id)
    if purchase.persisted? && purchase.seller_id != seller.id
      raise "Refusing to overwrite non-fixture purchase #{purchase.id}"
    end

    purchase.assign_attributes(
      seller_id: seller.id,
      email: buyer.email,
      full_name: buyer.name,
      price_cents: 0,
      displayed_price_cents: 0,
      tax_cents: 0,
      gumroad_tax_cents: 0,
      total_transaction_cents: 0,
      card_country: "US",
      ip_address: "192.0.2.#{index + 1}",
      purchase_state: "successful",
      succeeded_at: purchased_at,
      created_at: purchased_at,
      updated_at: purchased_at,
      offer_code: fixture_offer_code!(seller),
    )
    purchase.send(:calculate_fees)
    purchase.save!
  end

  def fixture_offer_code!(seller)
    seller.offer_codes.universal.alive.find_by(code: "shakaperf-discover") ||
      OfferCode.create!(
        user: seller,
        universal: true,
        amount_percentage: 100,
        code: "shakaperf-discover",
      )
  end
end

ShakaPerfDiscoverSeed.run!
