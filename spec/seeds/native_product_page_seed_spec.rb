# frozen_string_literal: true

require "digest/md5"
require "spec_helper"

RSpec.describe "native product page seed" do
  let(:seed_file) { Rails.root.join("scripts/seed_native_product_page.rb") }
  let(:unique_permalinks) { %w[OITPROS MCOREGUIDE MPSAUTOMATION MPURVIEW PowerPlatformITPros bgfjk] }

  it "refuses to run outside development, test, or benchmark before mutating records" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))
    expect(Taxonomy::Seeder).not_to receive(:new)

    expect { load(seed_file, true) }
      .to raise_error(RuntimeError, /development, test, or benchmark/)
    expect(Link.where(unique_permalink: unique_permalinks)).to be_empty
  end

  it "creates an idempotent catalog with production-shaped preview metadata" do
    expect { load(seed_file, true) }
      .to change { Link.where(unique_permalink: unique_permalinks).count }.from(0).to(6)
      .and change { Purchase.joins(:link).where(links: { unique_permalink: unique_permalinks }).count }.from(0).to(271)
      .and change { ProductReview.joins(:link).where(links: { unique_permalink: unique_permalinks }).count }.from(0).to(271)

    seller = User.find_by!(email: "office365-it-pros-benchmark@example.com")
    product = Link.fetch_leniently("O365IT")

    expect(seller).to have_attributes(name: "Office 365 for IT Pros", username: "o365itpros")
    expect(seller.json_data).to include(
      "native_product_page_fixture_owner" => "native-product-page-benchmark",
      "native_product_page_fixture_version" => 8,
    )
    expect(product).to have_attributes(
      user: seller,
      name: "Microsoft 365 for IT Pros (2027 Edition). The Ultimate Guide to Managing Microsoft 365.",
      price_cents: 5_995,
      native_type: Link::NATIVE_TYPE_EBOOK,
      display_product_reviews?: true,
      is_bundle?: true,
    )
    expect(product.custom_summary).to include("Four books")
    expect(product.custom_attributes).to include("name" => "Pages", "value" => "1000")
    expect(product.taxonomy).to have_attributes(slug: "software-development", parent_id: nil)
    expect(product.thumbnail.unsplash_url).to be_nil
    expect(product.thumbnail.file).to be_attached
    expect(product.thumbnail.file.blob.metadata).to include("width" => 600, "height" => 600)
    expect(product.thumbnail.thumbnail_variant.variation.transformations).to include(resize_to_limit: [600, 600])
    thumbnail_url = product.thumbnail.url
    expect(thumbnail_url).not_to include("/native-product-page-fixture/")
    expect(URI(thumbnail_url).path.split("/").last).to eq(product.thumbnail.thumbnail_variant.image.blob.key)
    preview = product.display_asset_previews.first
    expect(preview).to have_attributes(display_type: "image")
    expect(preview.file.filename.to_s).to eq("microsoft-365.png")
    expect(preview.as_json).to include(
      width: 670,
      height: 947,
      native_width: 1_000,
      native_height: 1_414,
    )
    expect(product.tags.pluck(:name)).to match_array(["microsoft 365", "it administration"])
    expect(product.product_reviews.visible_on_product_page.count).to eq(22)
    expect(product.reviews_count).to eq(22)
    expect(product.average_rating).to eq(5.0)
    expect(Link.fetch_leniently("M365PS")).to have_attributes(
      name: "Automating Microsoft 365 with PowerShell (2027 edition)",
      reviews_count: 3,
    )
    bundle_children = product.bundle_products.alive.in_order.includes(:product, :variant)
    expect(bundle_children.map { _1.product.unique_permalink }).to eq(
      %w[MCOREGUIDE MPSAUTOMATION MPURVIEW PowerPlatformITPros],
    )
    expect(bundle_children.map { _1.product.thumbnail_alive.unsplash_url }).to all(be_nil)
    expect(bundle_children.map { _1.product.thumbnail_alive.file }).to all(be_attached)
    expect(bundle_children.map { _1.product.thumbnail_alive.file.blob.metadata.slice("width", "height") }.uniq).to eq(
      [{ "width" => 600, "height" => 600 }],
    )
    expect(bundle_children.map { _1.product.price_cents }).to eq([3_995, 1_995, 1_295, 1_295])
    expect(bundle_children.map { _1.product.reviews_count }).to eq([4, 3, 2, 2])
    expect(bundle_children.map { _1.product.user }).to all(eq(seller))
    expect(bundle_children.second.variant.name).to eq("PDF and EPUB")
    expect(bundle_children.map(&:position)).to eq([0, 1, 2, 3])
    product_section = seller.seller_profile_sections.on_profile.sole
    expect(product_section).to have_attributes(
      type: "SellerProfileProductsSection",
      header: "Microsoft 365",
      default_product_sort: ProductSortKey::NEWEST,
      show_filters: false,
      add_new_products: true,
    )
    expect(product_section.shown_products).to match_array(Link.where(unique_permalink: unique_permalinks.first(5)).pluck(:id))
    expect(Link.where(id: product_section.shown_products).order(created_at: :desc).pluck(:custom_permalink)).to eq(
      %w[PowerPlatform O365IT M365Purview M365PS M365Core],
    )
    expect(seller.seller_profile.json_data).to eq(
      "tabs" => [{ "name" => "Products", "sections" => [product_section.id] }],
    )

    furushio = User.find_by!(email: "luis-furushio-benchmark@example.com")
    residential_guide = Link.fetch_leniently("bgfjk")
    expect(furushio).to have_attributes(
      name: "Luis Furushio",
      username: "luisfurushio",
      bio: "Architect and Digital Creator",
      twitter_handle: "Luis_Furushio",
    )
    expect(residential_guide).to have_attributes(
      user: furushio,
      name: "Graphic Guide to Residential Design (PDF Ebook)",
      price_cents: 4_000,
      native_type: Link::NATIVE_TYPE_EBOOK,
      reviews_count: 238,
    )
    expect(residential_guide.custom_summary).to eq("Graphic Guide to Residential Design")
    expect(residential_guide.taxonomy.ancestry_path).to eq(["design", "architecture"])
    expect(residential_guide.custom_attributes).to include(
      "name" => "Dimensions",
      "value" => "Metric and Imperial Systems",
    )
    expect(residential_guide.thumbnail.unsplash_url).to be_nil
    expect(residential_guide.thumbnail.file).to be_attached
    expect(residential_guide.thumbnail.file.blob.metadata).to include("width" => 600, "height" => 600)
    expect(residential_guide.display_asset_previews.map { _1.as_json.slice(:native_width, :native_height) }).to eq(
      [
        { native_width: 2_311, native_height: 1_771 },
        *Array.new(4, { native_width: 1_800, native_height: 1_379 }),
      ],
    )
    expect(residential_guide.display_asset_previews.map { _1.file.blob.byte_size }).to eq(
      [254_320, 263_964, 280_776, 283_991, 176_091],
    )
    description_urls = Nokogiri::HTML.fragment(residential_guide.description).css("img").map { _1["src"] }
    expect(description_urls).not_to be_empty
    expect(description_urls).to all(satisfy { !_1.include?("/native-product-page-fixture/") })
    description_blobs = description_urls.map { ActiveStorage::Blob.find_by!(key: URI(_1).path.split("/").last) }
    expect(description_blobs.map(&:filename).map(&:to_s)).to eq(
      [
        "luis-furushio-profile.png",
        *(1..6).map { "residential-guide-detail-#{_1}.jpg" },
      ],
    )
    expect(description_blobs.map(&:service_name).uniq).to eq([ActiveStorage::Blob.service.name.to_s])
    expect(description_blobs).to all(satisfy { ActiveStorage::Blob.service.exist?(_1.key) })
    expect(residential_guide.tags.pluck(:name)).to match_array(["residential design", "architecture"])
    expect(residential_guide.variant_categories_alive.first.alive_variants.in_order.pluck(:name)).to eq(["ENGLISH", "ESPAÑOL"])
    expect(residential_guide.product_reviews.visible_on_product_page.group(:rating).count).to eq(3 => 2, 4 => 5, 5 => 231)
    expect(residential_guide.json_data.dig("fixture_source_snapshot", "sales_count")).to eq(10_858)
    recommendations = RecommendedProducts::DiscoverService.fetch(
      purchaser: nil,
      cart_product_ids: [residential_guide.id],
      recommender_model_name: RecommendedProductsService::MODEL_SALES,
    )
    expect(recommendations.map { _1.product.unique_permalink }).to eq(
      %w[OITPROS MCOREGUIDE MPSAUTOMATION MPURVIEW PowerPlatformITPros],
    )
    expect(recommendations.map { _1.product.thumbnail_alive }).to all(be_present)
    expect(recommendations.map { _1.product.product_review_stat }).to all(be_present)
    expect(Discover::TaxonomyPresenter.new.taxonomies_for_nav.first(17).pluck(:slug)).to eq(
      %w[
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
      ],
    )

    expect { load(seed_file, true) }
      .to not_change { User.where("email LIKE ?", "%benchmark%example.com").count }
      .and not_change { Link.where(unique_permalink: unique_permalinks).count }
      .and not_change { BundleProduct.where(bundle: product).count }
      .and not_change { Purchase.joins(:link).where(links: { unique_permalink: unique_permalinks }).count }
      .and not_change { ProductReview.joins(:link).where(links: { unique_permalink: unique_permalinks }).count }
      .and not_change { CachedSalesRelatedProductsInfo.where(product: residential_guide).count }
      .and not_change(ActiveStorage::Blob, :count)
      .and not_change(ActiveStorage::Attachment, :count)
  end

  it "refuses to overwrite a product that already uses a fixture permalink" do
    unrelated_product = create(:product, custom_permalink: "O365IT", name: "My existing product")

    expect { load(seed_file, true) }
      .to raise_error(RuntimeError, /Refusing to overwrite non-fixture product/)

    expect(unrelated_product.reload.name).to eq("My existing product")
  end

  it "keeps fixture purchase discounts unavailable to storefront buyers" do
    load(seed_file, true)

    offer_codes = OfferCode.where(code: "native-page-review")
    purchase_code_ids = Purchase.joins(:link)
      .where(links: { unique_permalink: unique_permalinks })
      .distinct
      .pluck(:offer_code_id)

    expect(offer_codes.count).to eq(2)
    expect(offer_codes).to all(be_deleted)
    expect(purchase_code_ids).to match_array(offer_codes.ids)
    expect { load(seed_file, true) }.not_to change(offer_codes, :count)
  end

  it "repairs a same-named preview whose contents do not match the fixture" do
    load(seed_file, true)
    product = Link.fetch_leniently("O365IT")
    preview = product.display_asset_previews.first
    preview.file.attach(io: StringIO.new("stale fixture"), filename: "microsoft-365.png", content_type: "image/png")

    load(seed_file, true)

    expected_checksum = Digest::MD5.file(Rails.root.join("public/native-product-page-fixture/microsoft-365.png")).base64digest
    expect(preview.reload.file.blob.checksum).to eq(expected_checksum)
  end

  it "repairs a same-named thumbnail whose contents do not match the fixture" do
    load(seed_file, true)
    thumbnail = Link.fetch_leniently("O365IT").thumbnail
    stale_blob = ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("stale fixture"),
      filename: "microsoft-365.png",
      content_type: "image/png",
      identify: false,
    )
    stale_blob.update!(metadata: stale_blob.metadata.merge("identified" => true, "analyzed" => true, "width" => 600, "height" => 600))
    thumbnail.file.attach(stale_blob)

    load(seed_file, true)

    expect(thumbnail.reload.file.blob).not_to eq(stale_blob)
    expect(thumbnail.unsplash_url).to be_nil
    expect(thumbnail.file.blob.metadata).to include("width" => 600, "height" => 600)
  end

  it "repairs a thumbnail and description blob missing from the current service" do
    load(seed_file, true)
    product = Link.fetch_leniently("bgfjk")
    thumbnail_blob = product.thumbnail.file.blob
    description_url = Nokogiri::HTML.fragment(product.description).css("img").first["src"]
    description_blob = ActiveStorage::Blob.find_by!(key: URI(description_url).path.split("/").last)
    missing_keys = [thumbnail_blob.key, description_blob.key]
    service = ActiveStorage::Blob.service
    allow(service).to receive(:exist?).and_call_original
    missing_keys.each { allow(service).to receive(:exist?).with(_1).and_return(false) }

    load(seed_file, true)

    product.reload
    replacement_description_url = Nokogiri::HTML.fragment(product.description).css("img").first["src"]
    expect(product.thumbnail.file.blob).not_to eq(thumbnail_blob)
    expect(URI(replacement_description_url).path.split("/").last).not_to eq(description_blob.key)
  end

  it "repairs thumbnail and description blobs recorded against a stale service" do
    load(seed_file, true)
    product = Link.fetch_leniently("bgfjk")
    thumbnail_blob = product.thumbnail.file.blob
    description_url = Nokogiri::HTML.fragment(product.description).css("img").first["src"]
    description_blob = ActiveStorage::Blob.find_by!(key: URI(description_url).path.split("/").last)
    [thumbnail_blob, description_blob].each { _1.update_column(:service_name, "benchmark") }
    allow(ActiveStorage::Blob.services).to receive(:fetch).and_call_original
    expect(ActiveStorage::Blob.services).not_to receive(:fetch).with("benchmark")

    load(seed_file, true)

    product.reload
    replacement_description_url = Nokogiri::HTML.fragment(product.description).css("img").first["src"]
    replacement_description_blob = ActiveStorage::Blob.find_by!(key: URI(replacement_description_url).path.split("/").last)
    expect(product.thumbnail.file.blob.service_name).to eq(ActiveStorage::Blob.service.name.to_s)
    expect(replacement_description_blob.service_name).to eq(ActiveStorage::Blob.service.name.to_s)
  end

  it "reattaches a matching preview when its object is missing from the current service" do
    load(seed_file, true)
    preview = Link.fetch_leniently("O365IT").display_asset_previews.first
    missing_blob = preview.file.blob
    service = missing_blob.service
    allow(service).to receive(:exist?).and_return(true)
    allow(service).to receive(:exist?).with(missing_blob.key).and_return(false)

    load(seed_file, true)

    fixture = Rails.root.join("public/native-product-page-fixture/microsoft-365.png")
    expect(preview.reload.file.blob).not_to eq(missing_blob)
    expect(preview.file.blob.checksum).to eq(Digest::MD5.file(fixture).base64digest)
  end

  it "reattaches a matching preview recorded against a stale service" do
    load(seed_file, true)
    preview = Link.fetch_leniently("O365IT").display_asset_previews.first
    stale_blob = preview.file.blob
    stale_blob.update_column(:service_name, "benchmark")
    allow(ActiveStorage::Blob.services).to receive(:fetch).and_call_original
    expect(ActiveStorage::Blob.services).not_to receive(:fetch).with("benchmark")

    load(seed_file, true)

    replacement_blob = preview.reload.file.blob
    current_service = ActiveStorage::Blob.service
    expect(replacement_blob).not_to eq(stale_blob)
    expect(replacement_blob.service_name).to eq(current_service.name.to_s)
    expect(current_service.exist?(replacement_blob.key)).to be(true)
  end

  it "keeps the old preview intact when replacement rolls back" do
    load(seed_file, true)
    preview = Link.fetch_leniently("O365IT").display_asset_previews.first
    preview.file.attach(io: StringIO.new("stale fixture"), filename: "microsoft-365.png", content_type: "image/png")
    stale_blob = preview.reload.file.blob
    fixture_checksum = Digest::MD5.file(Rails.root.join("public/native-product-page-fixture/microsoft-365.png")).base64digest
    deleted_keys = []
    replacement_key = nil
    allow_any_instance_of(ActiveStorage::Blob).to receive(:delete) { |blob| deleted_keys << blob.key }
    allow_any_instance_of(ActiveStorage::Blob).to receive(:update!).and_wrap_original do |method, *args|
      blob = method.receiver
      if blob.filename.to_s == "microsoft-365.png" && blob.checksum == fixture_checksum
        replacement_key = blob.key
        raise "preview metadata failure"
      end

      method.call(*args)
    end

    expect { load(seed_file, true) }.to raise_error("preview metadata failure")

    expect(preview.reload.file.blob_id).to eq(stale_blob.id)
    expect(deleted_keys).to include(replacement_key)
    expect(deleted_keys).not_to include(stale_blob.key)
  end

  it "refuses to infer ownership from the fixture seller email" do
    unrelated_seller = create(:user, email: "office365-it-pros-benchmark@example.com", name: "Existing seller")

    expect { load(seed_file, true) }
      .to raise_error(RuntimeError, /Refusing to overwrite non-fixture user/)

    expect(unrelated_seller.reload.name).to eq("Existing seller")
  end

  it "refuses to claim a fixture username owned by another user" do
    unrelated_seller = create(:user, username: "o365itpros", email: "unrelated@example.com")

    expect { load(seed_file, true) }
      .to raise_error(RuntimeError, /Refusing to claim username/)

    expect(unrelated_seller.reload.email).to eq("unrelated@example.com")
  end
end
