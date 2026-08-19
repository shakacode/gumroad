# frozen_string_literal: true

require "spec_helper"

RSpec.describe "ShakaPerf seller profile seed" do
  let(:seed_file) { Rails.root.join("scripts/seed_shakaperf_seller_profile.rb") }
  let(:seller_email) { "shakaperf-profile@example.com" }

  it "creates an idempotent high-cardinality profile that exercises sold-out filtering" do
    Taxonomy::Seeder.new.perform

    expect { load(seed_file, true) }
      .to change { User.where(email: seller_email).count }.from(0).to(1)
      .and change { Link.joins(:user).where(users: { email: seller_email }).count }.from(0).to(22)
      .and change(BundleProduct, :count).by(4)
      .and change(VariantCategory, :count).by(4)
      .and change(Variant, :count).by(8)

    seller = User.find_by!(email: seller_email)
    expect(seller).to have_attributes(name: "ShakaPerf Microsoft 365 Lab", username: "shakaperfprofile")
    expect(seller.json_data).to include("fixture_owner" => "shakaperf-seller-profile", "fixture_version" => 1)
    expect(seller.avatar).to be_attached
    expect(seller.avatar).to have_attributes(filename: ActiveStorage::Filename.new("luis-furushio-profile.png"), byte_size: 141_657)
    expect(seller.avatar.blob.metadata).to include("width" => 400, "height" => 400)

    products = seller.products.order(created_at: :desc)
    expect(products.size).to eq(22)
    expect(products.map(&:hide_sold_out_variants?).uniq).to eq([true])
    expect(products.pluck(:created_at)).to eq(22.times.map { Time.utc(2026, 2, 1) - _1.minutes })

    section = seller.seller_profile_sections.on_profile.sole
    expect(section).to have_attributes(
      type: "SellerProfileProductsSection",
      default_product_sort: ProductSortKey::PAGE_LAYOUT,
      show_filters: true,
      add_new_products: false,
    )
    expect(section.shown_products).to eq(products.ids)

    variant_products = products.where("unique_permalink LIKE 'PROFILEVARIANT%'")
    expect(variant_products.size).to eq(4)
    expect(variant_products.map { _1.variant_categories_alive.sole.alive_variants.in_order.size }).to eq([2, 2, 2, 2])
    expect(variant_products.map(&:remaining_for_sale_count)).to eq([nil, 0, nil, 0])

    bundles = products.where("unique_permalink LIKE 'PROFILEBUNDLE%'").order(:unique_permalink)
    expect(bundles.size).to eq(2)
    expect(bundles.map { _1.bundle_products.alive.in_order.size }).to eq([2, 2])
    expect(bundles.map(&:remaining_for_sale_count)).to eq([15, 0])

    expected_sold_out_names = [
      "Compliance Workshop Recording",
      "Microsoft Graph Recipe Book",
      "Tenant Audit Session",
      "Security Design Clinic",
      "Bundle Component: Compliance",
      "Automation and Compliance Collection",
    ]
    request = ActionDispatch::TestRequest.create
    request.query_parameters[:size] = 36
    visitor = SellerContext.new(user: nil, seller: nil)
    Link.import(force: true, refresh: true)
    result = ProfileSectionsPresenter.new(seller:, query: seller.seller_profile_sections.on_profile)
      .props(request:, pundit_user: visitor, seller_custom_domain_url: nil)
    product_section = result[:sections].sole
    visible_names = product_section.dig(:search_results, :products).map { _1[:name] }
    expect(product_section.dig(:search_results, :total)).to eq(16)
    expect(visible_names).to eq(products.pluck(:name) - expected_sold_out_names)
    expect(visible_names).not_to include(*expected_sold_out_names)

    owner = SellerContext.new(user: seller, seller:)
    owner_result = ProfileSectionsPresenter.new(seller:, query: seller.seller_profile_sections.on_profile)
      .props(request:, pundit_user: owner, seller_custom_domain_url: nil, editing: false)
    expect(owner_result[:sections].sole.dig(:search_results, :products).size).to eq(22)

    expected_thumbnail_urls = %w[microsoft-365.png powershell.png purview.png power-platform.png]
      .map { "/native-product-page-fixture/#{_1}" }
    expect(products.map { _1.thumbnail_alive.url }.uniq).to match_array(expected_thumbnail_urls)
    expect(
      %w[microsoft-365.png powershell.png purview.png power-platform.png]
        .index_with { Rails.root.join("public/native-product-page-fixture", _1).size },
    ).to eq(
      "microsoft-365.png" => 920_947,
      "powershell.png" => 330_858,
      "purview.png" => 1_273_883,
      "power-platform.png" => 1_127_025,
    )

    original_order = section.shown_products
    expect { load(seed_file, true) }
      .to not_change { User.where(email: seller_email).count }
      .and not_change { seller.products.count }
      .and not_change { BundleProduct.where(bundle: bundles).count }
      .and not_change { Variant.joins(:variant_category).where(variant_categories: { link_id: variant_products }).count }
    expect(section.reload.shown_products).to eq(original_order)
  end

  it "refuses to overwrite a user that only shares the fixture email" do
    user = create(:user, email: seller_email, name: "Unrelated seller")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to overwrite non-fixture user/)
    expect(user.reload.name).to eq("Unrelated seller")
  end

  it "refuses to claim the fixture username from another user" do
    user = create(:user, email: "unrelated@example.com", username: "shakaperfprofile")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to claim username/)
    expect(user.reload.email).to eq("unrelated@example.com")
  end

  it "refuses to overwrite a product that only shares a fixture permalink" do
    Taxonomy::Seeder.new.perform
    product = create(:product, unique_permalink: "PROFILESIMPLEA", name: "Unrelated product")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to overwrite non-fixture product/)
    expect(product.reload.name).to eq("Unrelated product")
  end
end
