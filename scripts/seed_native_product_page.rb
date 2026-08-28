# frozen_string_literal: true

require "digest/md5"

# Seed realistic, database-backed creator storefronts for local product-page
# development.
#
# Usage:
#   bin/rails runner scripts/seed_native_product_page.rb
#
# Product metadata and cover art are a stable snapshot of the public Office 365
# for IT Pros storefront. Buyer accounts and review messages are synthetic.
# See public/native-product-page-fixture/SOURCES.md for source URLs and hashes.

module NativeProductPageSeed
  ALLOWED_ENVIRONMENTS = %w[development test benchmark].freeze
  OWNER = "native-product-page-benchmark"
  OWNER_KEY = "native_product_page_fixture_owner"
  VERSION = 7
  VERSION_KEY = "native_product_page_fixture_version"
  SELLER_EMAIL = "office365-it-pros-benchmark@example.com"
  BUYER_COUNT = 22
  STOREFRONT_CREATED_AT = Time.utc(2026, 1, 1)
  MEDIA_BASE_PATH = "/native-product-page-fixture"
  MEDIA_DIMENSIONS = {
    "microsoft-365.png" => [1_000, 1_414],
    "powershell.png" => [1_005, 1_421],
    "purview.png" => [1_005, 1_421],
    "power-platform.png" => [1_005, 1_421],
    "residential-guide-preview-1.jpg" => [2_311, 1_771],
    "residential-guide-preview-2.jpg" => [1_800, 1_379],
    "residential-guide-preview-3.jpg" => [1_800, 1_379],
    "residential-guide-preview-4.jpg" => [1_800, 1_379],
    "residential-guide-preview-5.jpg" => [1_800, 1_379],
  }.freeze
  NAV_TAXONOMY_SLUGS = %w[
    drawing-and-painting
    self-improvement
    3d
    design
    music-and-sound-design
    films
    software-development
    gaming
    business-and-money
    education
    photography
    writing-and-publishing
    comics-and-graphic-novels
    fitness-and-health
    recorded-music
    fiction-books
    audio
  ].freeze
  RECOMMENDED_PRODUCT_PERMALINKS = %w[OITPROS MCOREGUIDE MPSAUTOMATION MPURVIEW PowerPlatformITPros].freeze
  LOCAL_PORT = ENV.fetch("DEV_LANE_PORT", "3000")
  ReviewIdentity = Data.define(:id, :email, :name)

  PRODUCTS = [
    {
      unique_permalink: "OITPROS",
      permalink: "O365IT",
      name: "Microsoft 365 for IT Pros (2027 Edition). The Ultimate Guide to Managing Microsoft 365.",
      summary: "Four books: The main Microsoft 365 for IT Pros eBook and Automating Microsoft 365 with PowerShell, Microsoft Purview for IT Pros, and Power Platform for IT Pros. All books come in EPUB and PDF formats.",
      price_cents: 5995,
      storefront_position: 1,
      pages: 1_000,
      cover: "microsoft-365.png",
      native_type: Link::NATIVE_TYPE_EBOOK,
      is_bundle: true,
      bundle_children: %w[MCOREGUIDE MPSAUTOMATION MPURVIEW PowerPlatformITPros],
      review_count: 22,
      taxonomy_slug: "software-development",
      tags: ["microsoft 365", "it administration"],
      custom_attributes: [
        { "name" => "Pages", "value" => "1000" },
        { "name" => "Technology", "value" => "Microsoft 365" },
        { "name" => "Technology", "value" => "Office 365" },
        { "name" => "Technology", "value" => "Copilot for Microsoft 365" },
        { "name" => "Technology", "value" => "Exchange Online" },
        { "name" => "Technology", "value" => "Entra ID" },
        { "name" => "Technology", "value" => "SharePoint Online" },
        { "name" => "Technology", "value" => "Microsoft Teams" },
        { "name" => "Technology", "value" => "PowerShell" },
        { "name" => "Technology", "value" => "Microsoft Graph" },
        { "name" => "Technology", "value" => "Microsoft Graph PowerShell SDK" },
        { "name" => "Technology", "value" => "Planner" },
        { "name" => "Technology", "value" => "Teams devices" },
        { "name" => "Technology", "value" => "Intune" },
        { "name" => "Technology", "value" => "Purview Compliance" },
        { "name" => "Technology", "value" => "Information Protection" },
        { "name" => "Technology", "value" => "eDiscovery" },
        { "name" => "Technology", "value" => "Stream" },
        { "name" => "Technology", "value" => "OneDrive for Business" },
        { "name" => "Technology", "value" => "Power Pages" },
        { "name" => "Technology", "value" => "Copilot Studio" },
        { "name" => "Technology", "value" => "Power Apps" },
        { "name" => "Technology", "value" => "Power Automate" },
        { "name" => "ISBN", "value" => "9798329544596" },
      ],
      description: <<~HTML,
        <h2>The ultimate guide to managing Microsoft 365</h2>
        <p>A continuously updated reference for tenant administrators, architects, and support teams. The bundle covers identity, Exchange Online, Teams, SharePoint Online, security, compliance, and practical automation.</p>
        <h3>What is included</h3>
        <ul>
          <li>The main Microsoft 365 for IT Pros ebook in PDF and EPUB formats</li>
          <li>Companion guides for PowerShell, Microsoft Purview, and Power Platform</li>
          <li>Monthly content updates throughout the edition</li>
          <li>More than 1,000 pages of operational guidance and examples</li>
        </ul>
        <p>Built for working IT professionals who need practical detail instead of marketing summaries.</p>
      HTML
    },
    {
      unique_permalink: "MCOREGUIDE",
      permalink: "M365Core",
      name: "Microsoft 365 Core Guide (2027 Edition)",
      summary: "The main Microsoft 365 for IT Pros guide in PDF and EPUB formats",
      price_cents: 3995,
      storefront_position: 4,
      pages: 1_000,
      cover: "microsoft-365.png",
      native_type: Link::NATIVE_TYPE_EBOOK,
      review_count: 4,
      taxonomy_slug: "software-development",
      tags: ["microsoft 365", "it administration"],
      description: <<~HTML,
        <h2>The core Microsoft 365 operations guide</h2>
        <p>The main book from the Microsoft 365 for IT Pros bundle, covering identity, Exchange Online, Teams, SharePoint Online, security, compliance, and tenant operations.</p>
        <p>Includes PDF and EPUB formats with monthly updates throughout the edition.</p>
      HTML
    },
    {
      unique_permalink: "MPSAUTOMATION",
      permalink: "M365PS",
      name: "Automating Microsoft 365 with PowerShell (2027 edition)",
      summary: "Copies of the book in PDF and EPUB format",
      price_cents: 1995,
      storefront_position: 3,
      pages: 450,
      cover: "powershell.png",
      native_type: Link::NATIVE_TYPE_EBOOK,
      review_count: 3,
      variants: ["PDF and EPUB", "PDF only"],
      taxonomy_slug: "software-development",
      tags: ["powershell", "automation"],
      custom_attributes: [
        { "name" => "Pages", "value" => "450" },
        { "name" => "Technology", "value" => "PowerShell" },
        { "name" => "Technology", "value" => "Microsoft Graph" },
        { "name" => "Technology", "value" => "Microsoft Graph PowerShell SDK" },
        { "name" => "Technology", "value" => "Microsoft 365" },
        { "name" => "Technology", "value" => "Exchange Online" },
        { "name" => "Technology", "value" => "Entra ID" },
        { "name" => "Technology", "value" => "SharePoint Online" },
        { "name" => "Technology", "value" => "Microsoft Teams" },
      ],
      description: <<~HTML,
        <h2>Turn repetitive administration into reliable automation</h2>
        <p>A hands-on guide to the Microsoft Graph PowerShell SDK, Exchange Online, Teams, SharePoint Online, and Entra ID. Examples focus on reporting, lifecycle management, resilient scripts, and secure unattended execution.</p>
        <p>The 2027 edition includes PDF and EPUB files with approximately 450 pages of tested patterns and explanations.</p>
      HTML
    },
    {
      unique_permalink: "MPURVIEW",
      permalink: "M365Purview",
      name: "Microsoft Purview for IT Pros (2027 Edition)",
      summary: "Deep technical insight into how the most important Microsoft Purview solutions work. Includes coverage of Data Lifecycle Management, Data Loss Prevention, Information Protection, and eDiscovery.",
      price_cents: 1295,
      storefront_position: 2,
      pages: 310,
      cover: "purview.png",
      native_type: Link::NATIVE_TYPE_DIGITAL,
      review_count: 2,
      taxonomy_slug: "software-development",
      tags: ["microsoft purview", "compliance"],
      custom_attributes: [
        { "name" => "Data Loss Prevention", "value" => "Information Protection" },
        { "name" => "Data Lifecycle Management", "value" => "Retention labels and policies" },
        { "name" => "Auditing and Reporting", "value" => "Sensitivity labels and policies" },
        { "name" => "Communication Compliance", "value" => "eDiscovery" },
      ],
      description: <<~HTML,
        <h2>Put Microsoft Purview into practice</h2>
        <p>Understand retention, sensitivity labels, eDiscovery, audit, data loss prevention, and insider risk from an administrator's perspective. Scenario-led chapters connect configuration choices to day-to-day governance work.</p>
        <p>Includes PDF and EPUB editions plus updates during the edition year.</p>
      HTML
    },
    {
      unique_permalink: "PowerPlatformITPros",
      permalink: "PowerPlatform",
      name: "Power Platform for IT Pros (2027 Edition)",
      summary: "Learn how to exploit the capabilities of Microsoft Power Platform to automate Microsoft 365 management",
      price_cents: 1295,
      storefront_position: 0,
      pages: 280,
      cover: "power-platform.png",
      native_type: Link::NATIVE_TYPE_DIGITAL,
      review_count: 2,
      taxonomy_slug: "software-development",
      tags: ["power platform", "governance"],
      custom_attributes: [
        { "name" => "Microsoft 365", "value" => "Power Platform" },
        { "name" => "Power BI", "value" => "Power Automate" },
        { "name" => "Power Apps", "value" => "Copilot Studio" },
        { "name" => "Power Pages", "value" => "Microsoft Fabric" },
        { "name" => "Microsoft 365 Fabric", "value" => "" },
      ],
      description: <<~HTML,
        <h2>Operate Power Platform with confidence</h2>
        <p>A concise field guide to environments, connectors, data policies, the Power Platform admin center, governance at scale, and the Center of Excellence starter kit.</p>
        <p>Written for Microsoft 365 teams responsible for balancing maker productivity with operational control.</p>
      HTML
    },
  ].freeze

  FURUSHIO_PRODUCT = {
    unique_permalink: "bgfjk",
    permalink: "bgfjk",
    name: "Graphic Guide to Residential Design (PDF Ebook)",
    summary: "Graphic Guide to Residential Design",
    price_cents: 4000,
    thumbnail: "residential-guide-thumbnail.jpg",
    preview_images: (1..5).map { |index| "residential-guide-preview-#{index}.jpg" },
    native_type: Link::NATIVE_TYPE_EBOOK,
    rating_counts: { 5 => 231, 4 => 5, 3 => 2 },
    taxonomy_slug: "architecture",
    tags: ["residential design", "architecture"],
    custom_attributes: [
      { "name" => "Pages", "value" => "300" },
      { "name" => "Format", "value" => "High Quality Print PDF" },
      { "name" => "Dimensions", "value" => "Metric and Imperial Systems" },
      { "name" => "Free Updates", "value" => "Included ✅" },
    ],
    variants: ["ENGLISH", "ESPAÑOL"],
    source_snapshot: {
      "url" => "https://luisfurushio.gumroad.com/l/bgfjk",
      "captured_at" => "2026-08-12",
      "sales_count" => 10_858,
    },
    review_message_offset: 3,
    review_messages: [
      "The diagrams make floor-plan decisions much easier to understand.",
      "A practical visual reference that I keep returning to during design reviews.",
      "Clear enough for homeowners and detailed enough to be useful on real projects.",
      "The side-by-side examples explain residential design better than pages of theory.",
      "Metric and Imperial dimensions make this genuinely useful across our whole team.",
      "An excellent guide for learning how circulation, light, and proportion work together.",
      "The illustrated explanations helped us ask much better questions during our remodel.",
      "Dense with ideas but exceptionally easy to browse and absorb.",
    ],
    description: <<~HTML,
      <p>A visual guide to understanding home design.</p>
      <p>With over 1,000 colorful illustrations, this ebook explains the why behind residential design in a clear, simple, and engaging way.</p>
      <p>Perfect for homeowners, architecture students, and contractors.</p>
      <h3>👋 Welcome!</h3>
      <p>I’m Luis, a residential designer and Peruvian architect with over 20 years of experience designing homes across California.</p>
      <p>I created this ebook to answer the most common questions I get during the early stages of the design process. In architecture, every design decision has a reason. This guide explains those reasons through hundreds of easy-to-follow illustrations—without overwhelming jargon or long blocks of text.</p>
      <h3>📘 What’s inside</h3>
      <ul>
        <li>1,000+ easy-to-understand drawings</li>
        <li>Interior and exterior design tips</li>
        <li>Real floor plan analysis</li>
        <li>Common design mistakes to avoid</li>
        <li>All dimensions in Imperial and Metric</li>
        <li>Free future updates with new content</li>
      </ul>
      <h3>🙌 Who this is for</h3>
      <ul>
        <li>Homeowners remodeling or building a home</li>
        <li>Architecture students tired of dry textbooks</li>
        <li>Contractors wanting to sharpen their design eye</li>
        <li>Curious design lovers who learn better visually</li>
      </ul>
      <h3>📩 What you’ll receive</h3>
      <ul>
        <li>A full-color digital PDF sized for phones, tablets, and computers</li>
        <li>An immediate download link after purchase</li>
        <li>Your name watermarked on the file</li>
      </ul>
      <figure><img src="#{MEDIA_BASE_PATH}/luis-furushio-profile.png" alt="Luis Furushio"></figure>
      <figure><img src="#{MEDIA_BASE_PATH}/residential-guide-detail-1.jpg" alt="Residential design guide sample spread"></figure>
      <figure><img src="#{MEDIA_BASE_PATH}/residential-guide-detail-2.jpg" alt="Residential design guide floor plan sample"></figure>
      <figure><img src="#{MEDIA_BASE_PATH}/residential-guide-detail-3.jpg" alt="Residential design guide illustration sample"></figure>
      <figure><img src="#{MEDIA_BASE_PATH}/residential-guide-detail-4.jpg" alt="Residential design guide interior sample"></figure>
      <figure><img src="#{MEDIA_BASE_PATH}/residential-guide-detail-5.jpg" alt="Residential design guide exterior sample"></figure>
      <figure><img src="#{MEDIA_BASE_PATH}/residential-guide-detail-6.jpg" alt="Residential design guide reference sample"></figure>
      <h3>📌 License and Support</h3>
      <p>This is a digital product. If you have technical issues, email <a href="mailto:hola@luisfurushio.com">hola@luisfurushio.com</a>.</p>
    HTML
  }.freeze

  REVIEW_MESSAGES = [
    "Clear, practical, and unusually thorough. I keep it open while administering our tenant.",
    "The monthly-update approach makes this far more useful than a conventional technical book.",
    "Excellent operational detail and enough context to understand why each recommendation matters.",
    "Saved our team hours of research during a tenant rollout.",
    "The examples translate directly to real administration work.",
    "A dependable reference for both planning and troubleshooting.",
    "Dense in the best way: searchable, current, and grounded in experience.",
    "Useful for experienced admins without becoming inaccessible to newer team members.",
  ].freeze

  module_function

  def run!
    uploaded_blobs = []
    unless Rails.env.in?(ALLOWED_ENVIRONMENTS)
      raise "Native product fixture may only run in development, test, or benchmark"
    end

    seed_taxonomy_navigation!

    ActiveRecord::Base.transaction do
      seller = owned_user!(
        email: SELLER_EMAIL,
        name: "Office 365 for IT Pros",
        username: "o365itpros",
        bio: "Independent technical ebooks for Microsoft 365 administrators, written and continuously updated by experienced IT professionals.",
      )
      furushio = owned_user!(
        email: "luis-furushio-benchmark@example.com",
        name: "Luis Furushio",
        username: "luisfurushio",
        bio: "Architect and Digital Creator",
        attributes: { twitter_handle: "Luis_Furushio" },
      )
      buyers = seed_buyers!
      products = PRODUCTS.map { |attributes| seed_product!(seller:, buyers:, attributes:, uploaded_blobs:) }
      seed_bundle_products!(products:)
      seed_seller_profile!(seller:, products:)
      residential_guide = seed_product!(seller: furushio, buyers:, attributes: FURUSHIO_PRODUCT, uploaded_blobs:)
      products << residential_guide
      seed_recommendations!(source: residential_guide, products:)

      puts "Seeded 2 creators: #{products.size} products and #{products.sum(&:reviews_count)} reviews."
      products.each do |product|
        url = "http://#{product.user.username}.localhost:#{LOCAL_PORT}/l/#{product.general_permalink}?layout=discover"
        puts "Ordinary: #{url}"
        puts "RSC:      #{url}&rsc=1"
      end
    end
  rescue
    delete_uploaded_blobs(uploaded_blobs)
    raise
  end

  def owned_user!(email:, name:, username:, bio: nil, attributes: {})
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
      bio:,
      user_risk_state: "compliant",
      confirmed_at: user.confirmed_at || STOREFRONT_CREATED_AT,
      payment_address: email,
      **attributes,
    )
    user.json_data[OWNER_KEY] = OWNER
    user.json_data[VERSION_KEY] = VERSION
    user.password = SecureRandom.hex(24) if user.new_record?
    user.save!
    user
  end

  def seed_buyers!
    BUYER_COUNT.times.map do |index|
      owned_user!(
        email: "native-product-buyer-#{index + 1}@example.com",
        name: "Benchmark Reader #{index + 1}",
        username: "benchmarkreader#{index + 1}",
      )
    end
  end

  def seed_product!(seller:, buyers:, attributes:, uploaded_blobs:)
    permalink = attributes.fetch(:permalink)
    unique_permalink = attributes.fetch(:unique_permalink)
    product = Link.find_by(unique_permalink:)
    product_by_general_permalink = Link.by_general_permalink(permalink).order(created_at: :asc, id: :asc).first
    if product && product_by_general_permalink && product.id != product_by_general_permalink.id
      raise "Refusing to claim permalink #{permalink.inspect} already used by product #{product_by_general_permalink.id}"
    end
    product ||= product_by_general_permalink
    if product && (product.user_id != seller.id || product.json_data[OWNER_KEY] != OWNER)
      raise "Refusing to overwrite non-fixture product with permalink #{permalink.inspect}"
    end

    product ||= seller.links.build(unique_permalink:)
    product.assign_attributes(
      user: seller,
      custom_permalink: permalink == unique_permalink ? nil : permalink,
      name: attributes.fetch(:name),
      description: attributes.fetch(:description),
      filetype: "pdf",
      native_type: attributes.fetch(:native_type),
      taxonomy: Taxonomy.find_by!(slug: attributes.fetch(:taxonomy_slug)),
      price_cents: attributes.fetch(:price_cents),
      created_at: STOREFRONT_CREATED_AT - attributes.fetch(:storefront_position, 0).days,
      display_product_reviews: true,
      draft: false,
      purchase_disabled_at: nil,
      deleted_at: nil,
      is_bundle: attributes.fetch(:is_bundle, false),
    )
    product.json_data[OWNER_KEY] = OWNER
    product.json_data[VERSION_KEY] = VERSION
    product.json_data["custom_summary"] = attributes.fetch(:summary)
    product.json_data["custom_attributes"] = attributes[:custom_attributes] || [
      { "name" => "Pages", "value" => attributes.fetch(:pages).to_fs(:delimited) },
      { "name" => "Formats", "value" => "PDF and EPUB" },
      { "name" => "Edition", "value" => "2027" },
    ]
    product.json_data["fixture_source_snapshot"] = attributes[:source_snapshot] if attributes[:source_snapshot]
    product.save!
    product.save_tags!(attributes.fetch(:tags))

    thumbnail = Thumbnail.find_or_initialize_by(product:)
    thumbnail.update!(
      unsplash_url: "#{MEDIA_BASE_PATH}/#{attributes[:thumbnail] || attributes.fetch(:cover)}",
      deleted_at: nil,
    )

    seed_previews!(product:, images: attributes[:preview_images] || [attributes.fetch(:cover)], uploaded_blobs:)
    seed_variants!(product:, names: attributes[:variants] || [])

    ratings = attributes[:rating_counts]&.flat_map { |rating, count| Array.new(count, rating) } || Array.new(attributes.fetch(:review_count), 5)
    reviewers = attributes[:rating_counts] ? guest_reviewers(product:, count: ratings.size) : buyers.first(ratings.size)
    review_messages = attributes[:review_messages] || REVIEW_MESSAGES
    reviewers.each_with_index do |buyer, index|
      seed_review!(
        product:,
        seller:,
        buyer:,
        rating: ratings.fetch(index),
        message: review_messages.fetch((index + attributes[:review_message_offset].to_i) % review_messages.size),
        position: index,
      )
    end
    remove_surplus_reviews!(product:, reviewers:)
    product.sync_review_stat

    product.reload
  end

  def seed_bundle_products!(products:)
    products_by_permalink = products.index_by(&:unique_permalink)
    PRODUCTS.each do |attributes|
      bundle = products_by_permalink.fetch(attributes.fetch(:unique_permalink))
      desired_ids = attributes.fetch(:bundle_children, []).each_with_index.map do |permalink, position|
        child = products_by_permalink.fetch(permalink)
        variant = child.has_multiple_variants? ? child.alive_variants.in_order.first : nil
        bundle_product = bundle.bundle_products.find_or_initialize_by(product: child)
        bundle_product.update!(variant:, quantity: 1, position:, deleted_at: nil)
        bundle_product.id
      end
      bundle.bundle_products.where.not(id: desired_ids).update_all(deleted_at: STOREFRONT_CREATED_AT)
    end
  end

  def seed_recommendations!(source:, products:)
    recommended_products = RECOMMENDED_PRODUCT_PERMALINKS.map do |permalink|
      products.find { _1.unique_permalink == permalink } || raise("Missing recommended product #{permalink}")
    end
    recommended_products.each_with_index do |product, index|
      SalesRelatedProductsInfo.find_or_create_info(source.id, product.id).update!(sales_count: recommended_products.size - index)
    end
    UpdateCachedSalesRelatedProductsInfosJob.new.perform(source.id)
  end

  def seed_previews!(product:, images:, uploaded_blobs:)
    desired_guids = images.each_with_index.map do |image, index|
      guid = "native-page-#{product.unique_permalink.downcase}-#{index + 1}"
      width, height = MEDIA_DIMENSIONS.fetch(image)
      preview = product.asset_previews.find_or_initialize_by(guid:)
      preview.assign_attributes(deleted_at: nil, position: index)
      preview.unsplash_url = "#{MEDIA_BASE_PATH}/#{image}" unless preview.file.attached?
      preview.save!

      fixture_path = Rails.root.join("public/native-product-page-fixture", image)
      fixture_checksum = Digest::MD5.file(fixture_path).base64digest
      content_type = image.end_with?(".png") ? "image/png" : "image/jpeg"
      unless preview.file.attached? && preview.file.filename.to_s == image && preview.file.blob.checksum == fixture_checksum
        blob = fixture_path.open("rb") do |file|
          ActiveStorage::Blob.create_and_upload!(io: file, filename: image, content_type:, identify: false)
        end
        uploaded_blobs << blob
        preview.file.attach(blob)
      end
      preview.file.blob.update!(
        metadata: preview.file.blob.metadata.merge(
          "identified" => true,
          "analyzed" => true,
          "width" => width,
          "height" => height,
        ),
      )
      preview.update!(unsplash_url: nil, oembed: nil)
      guid
    end
    product.asset_previews.where.not(guid: desired_guids).update_all(deleted_at: STOREFRONT_CREATED_AT)
  end

  def delete_uploaded_blobs(uploaded_blobs)
    # The database rollback removes blob rows, but remote objects need explicit cleanup.
    uploaded_blobs.each do |blob|
      blob.delete
    rescue StandardError
      warn "Failed to delete an uploaded native product fixture after rollback"
    end
  end

  def seed_seller_profile!(seller:, products:)
    section = seller.seller_profile_sections.find_or_initialize_by(
      type: "SellerProfileProductsSection",
      header: "Microsoft 365",
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
    seller.seller_profile_sections.on_profile.where.not(id: section.id).delete_all

    profile = SellerProfile.find_or_initialize_by(seller:)
    profile.update!(json_data: { "tabs" => [{ "name" => "Products", "sections" => [section.id] }] })
  end

  def seed_taxonomy_navigation!
    Taxonomy::Seeder.new.perform
    NAV_TAXONOMY_SLUGS.reverse_each.with_index(1) do |slug, recent_sales_count|
      taxonomy = Taxonomy.find_by!(slug:, parent_id: nil)
      taxonomy.create_taxonomy_stat! unless taxonomy.taxonomy_stat
      taxonomy.taxonomy_stat.update!(recent_sales_count:)
    end
    Rails.cache.delete("taxonomies_for_nav")
  end

  def seed_variants!(product:, names:)
    if names.empty?
      product.variant_categories.alive.update_all(deleted_at: STOREFRONT_CREATED_AT)
      return
    end

    category = product.variant_categories.find_or_initialize_by(title: "Language")
    category.update!(deleted_at: nil)
    names.each_with_index do |name, index|
      variant = category.variants.find_or_initialize_by(name:)
      variant.update!(price_difference_cents: 0, position_in_category: index, deleted_at: nil)
    end
    category.variants.alive.where.not(name: names).update_all(deleted_at: STOREFRONT_CREATED_AT)
    product.variant_categories.alive.where.not(id: category.id).update_all(deleted_at: STOREFRONT_CREATED_AT)
  end

  def guest_reviewers(product:, count:)
    count.times.map do |index|
      ReviewIdentity.new(
        id: nil,
        email: "native-product-#{product.unique_permalink.downcase}-review-#{index + 1}@example.com",
        name: "Benchmark Reader #{index + 1}",
      )
    end
  end

  def remove_surplus_reviews!(product:, reviewers:)
    purchases = Purchase.where(link_id: product.id).where.not(email: reviewers.map(&:email))
    ProductReview.where(purchase_id: purchases.select(:id)).delete_all
    purchases.delete_all
  end

  def seed_review!(product:, seller:, buyer:, rating:, message:, position:)
    identity = buyer.id ? { purchaser_id: buyer.id } : { email: buyer.email }
    reviewed_at = STOREFRONT_CREATED_AT + position.minutes
    purchase = Purchase.find_or_initialize_by(link_id: product.id, **identity)
    if purchase.persisted? && purchase.seller_id != seller.id
      raise "Refusing to overwrite non-fixture purchase #{purchase.id}"
    end

    unless purchase.persisted?
      purchase.assign_attributes(
        seller_id: seller.id,
        price_cents: 0,
        displayed_price_cents: 0,
        tax_cents: 0,
        gumroad_tax_cents: 0,
        total_transaction_cents: 0,
        email: buyer.email,
        purchaser_id: buyer.id,
        full_name: buyer.name,
        card_country: "US",
        ip_address: "192.0.2.#{buyer.email.bytes.sum % 200 + 1}",
        offer_code: fixture_offer_code!(seller),
        created_at: reviewed_at,
        updated_at: reviewed_at,
      )
      purchase.send(:calculate_fees)
      purchase.save!
    end
    purchase.update!(purchase_state: "successful", succeeded_at: reviewed_at, created_at: reviewed_at, updated_at: reviewed_at)

    review = purchase.post_review(rating:, message:)
    review.update_columns(created_at: reviewed_at, updated_at: reviewed_at)
  end

  def fixture_offer_code!(seller)
    offer_code = seller.offer_codes.universal.where(code: "native-page-review").order(:id).first_or_initialize
    offer_code.update!(amount_cents: nil, amount_percentage: 100, deleted_at: STOREFRONT_CREATED_AT)
    offer_code
  end
end

NativeProductPageSeed.run!
