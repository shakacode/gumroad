# frozen_string_literal: true

require "digest/sha2"
require "spec_helper"

RSpec.describe "ShakaPerf Discover seed" do
  let(:seed_file) { Rails.root.join("scripts/seed_shakaperf_discover.rb") }
  let(:unique_permalinks) { ("A".."X").map { "DISCOVER#{_1}" } }

  it "refuses to run outside development, test, or benchmark before mutating records" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))
    expect(User).not_to receive(:find_by)

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /development, test, or benchmark/)
  end

  it "creates an idempotent and searchable 24-card category in stable order" do
    Taxonomy::Seeder.new.perform

    expect { load(seed_file, true) }
      .to change { Link.where(unique_permalink: unique_permalinks).count }.from(0).to(24)
      .and change { Purchase.joins(:link).where(links: { unique_permalink: unique_permalinks }).count }.from(0).to(24)
      .and change { User.where("email LIKE ?", "shakaperf-discover-%@example.com").count }.from(0).to(5)

    products = Link.where(unique_permalink: unique_permalinks).order(created_at: :desc)
    expect(products.pluck(:unique_permalink)).to eq(unique_permalinks)
    expect(products.pluck(:created_at)).to eq(24.times.map { Time.utc(2026, 3, 1) - _1.minutes })
    catalog_rows = products.map { [_1.unique_permalink, _1.name, _1.price_cents, _1.user.username] }
    expect(Digest::SHA256.hexdigest(catalog_rows.flatten.join("\0"))).to eq(
      "29ade4b2551e220a66a32d4f200061b41c56ce0c017edd3dc88092c09b20b989",
    )
    expect(products.map(&:recommendable?)).to all(eq(true))
    expect(products.map { _1.json_data.slice("fixture_owner", "fixture_version") }.uniq).to eq(
      [{ "fixture_owner" => "shakaperf-discover", "fixture_version" => 1 }],
    )
    expect(products.map(&:user).uniq.size).to eq(4)
    expect(products.map(&:reviews_count).min).to be >= 14
    expect(products.map(&:average_rating).min).to be >= 4.7

    taxonomy = Taxonomy.find_by!(slug: "programming", parent: Taxonomy.find_by!(slug: "software-development"))
    Link.import(force: true, refresh: true)
    category_results = Link.search(
      Link.search_options(
        size: DiscoverController::INITIAL_PRODUCTS_COUNT,
        taxonomy_id: taxonomy.id,
        include_taxonomy_descendants: true,
        sort: ProductSortKey::NEWEST,
        track_total_hits: true,
      ),
    )
    search_results = Link.search(
      Link.search_options(
        size: DiscoverController::INITIAL_PRODUCTS_COUNT,
        query: "ShakaPerf",
        sort: ProductSortKey::NEWEST,
        track_total_hits: true,
      ),
    )
    expect(category_results.results.total).to eq(24)
    expect(category_results.records.map(&:unique_permalink)).to eq(unique_permalinks)
    expect(search_results.results.total).to eq(24)
    expect(search_results.records.map(&:unique_permalink)).to eq(unique_permalinks)
    expect(DiscoverController::INITIAL_PRODUCTS_COUNT).to be >= 24

    cards = products.includes(ProductPresenter::ASSOCIATIONS_FOR_CARD).map do |product|
      ProductPresenter.card_for_web(product:, target: Product::Layout::DISCOVER)
    end
    expect(cards.map { _1[:name] }).to eq(24.times.map { format("ShakaPerf Programming Kit %02d", _1 + 1) })
    expect(cards.map { _1[:thumbnail_url] }.uniq).to match_array(
      %w[microsoft-365.png powershell.png purview.png power-platform.png]
        .map { "/native-product-page-fixture/#{_1}" },
    )
    expect(cards.map { _1.dig(:ratings, :count) }).to all(be >= 14)
    expect(cards.map { _1.dig(:seller, :name) }.uniq.size).to eq(4)
    expect(
      %w[microsoft-365.png powershell.png purview.png power-platform.png]
        .index_with { Rails.root.join("public/native-product-page-fixture", _1).size },
    ).to eq(
      "microsoft-365.png" => 920_947,
      "powershell.png" => 330_858,
      "purview.png" => 1_273_883,
      "power-platform.png" => 1_127_025,
    )

    expect { load(seed_file, true) }
      .to not_change { Link.where(unique_permalink: unique_permalinks).count }
      .and not_change { Purchase.joins(:link).where(links: { unique_permalink: unique_permalinks }).count }
      .and not_change { User.where("email LIKE ?", "shakaperf-discover-%@example.com").count }
    expect(Link.where(unique_permalink: unique_permalinks).order(created_at: :desc).pluck(:unique_permalink)).to eq(unique_permalinks)
  end

  it "refuses to overwrite a user that only shares a fixture email" do
    user = create(:user, email: "shakaperf-discover-a@example.com", name: "Unrelated seller")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to overwrite non-fixture user/)
    expect(user.reload.name).to eq("Unrelated seller")
  end

  it "refuses to claim a fixture username from another user" do
    user = create(:user, email: "unrelated@example.com", username: "shakaperfdiscovera")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to claim username/)
    expect(user.reload.email).to eq("unrelated@example.com")
  end

  it "refuses to overwrite a product that only shares a fixture permalink" do
    Taxonomy::Seeder.new.perform
    product = create(:product, unique_permalink: "DISCOVERA", name: "Unrelated product")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to overwrite non-fixture product/)
    expect(product.reload.name).to eq("Unrelated product")
  end
end
