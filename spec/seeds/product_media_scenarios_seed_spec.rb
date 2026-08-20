# frozen_string_literal: true

require "spec_helper"

RSpec.describe "product media scenarios seed" do
  let(:seed_file) { Rails.root.join("scripts/seed_product_media_scenarios.rb") }
  let(:permalinks) { %w[mediagallery mediamembership] }

  it "creates two idempotent products covering image, playback, download, and recurring scenarios" do
    expect { load(seed_file, true) }
      .to change { Link.where(unique_permalink: permalinks).count }.from(0).to(2)
      .and change { Thumbnail.joins(:product).where(links: { unique_permalink: permalinks }).count }.from(0).to(2)
      .and change { AssetPreview.joins(:link).where(links: { unique_permalink: permalinks }).count }.from(0).to(5)
      .and change { ProductFile.joins(:link).where(links: { unique_permalink: permalinks }).count }.from(0).to(3)

    gallery = Link.find_by!(unique_permalink: "mediagallery")
    expect(gallery).to have_attributes(
      name: "Media gallery bundle",
      price_cents: 1_500,
      native_type: Link::NATIVE_TYPE_DIGITAL,
    )
    expect(gallery.is_recurring_billing).to eq(false)
    expect(gallery.thumbnail.file.filename.to_s).to eq("smilie.png")
    expect(gallery.display_asset_previews.map(&:display_type)).to eq(%w[image image video oembed])
    expect(gallery.display_asset_previews.map(&:filetype)).to eq(["png", "gif", "mov", nil])
    expect(gallery.product_files.alive.in_order.map(&:filegroup)).to eq(%w[audio video document])
    expect(gallery.product_files.alive.in_order.map(&:display_name)).to eq(
      ["Sample audio track", "Sample streamable video", "Sample PDF guide"],
    )

    membership = Link.find_by!(unique_permalink: "mediamembership")
    expect(membership.name).to eq("Video course membership")
    expect(membership[:price_cents]).to eq(800)
    expect(membership.default_tier.prices.alive.find_by!(recurrence: :monthly).price_cents).to eq(800)
    expect(membership.native_type).to eq(Link::NATIVE_TYPE_MEMBERSHIP)
    expect(membership.subscription_duration).to eq("monthly")
    expect(membership.is_recurring_billing).to eq(true)
    expect(membership.thumbnail.file.filename.to_s).to eq("Austin's Mojo.png")
    expect(membership.display_asset_previews.sole.file.filename.to_s).to eq("autumn-leaves-1280x720.jpeg")
    expect(membership.alive_rich_contents.sole.description.pluck("type")).to eq(%w[paragraph mediaEmbed])

    seller = User.find_by!(email: "media-scenarios@example.com")
    expect(seller.seller_profile_sections.on_profile.sole.shown_products).to match_array([gallery.id, membership.id])

    expect { load(seed_file, true) }
      .to not_change { User.where(email: "media-scenarios@example.com").count }
      .and not_change { Link.where(unique_permalink: permalinks).count }
      .and not_change { Thumbnail.joins(:product).where(links: { unique_permalink: permalinks }).count }
      .and not_change { AssetPreview.joins(:link).where(links: { unique_permalink: permalinks }).count }
      .and not_change { ProductFile.joins(:link).where(links: { unique_permalink: permalinks }).count }
  end

  it "refuses to overwrite an unrelated product using a fixture permalink" do
    product = create(:product, unique_permalink: "mediagallery", name: "Existing product")

    expect { load(seed_file, true) }.to raise_error(RuntimeError, /Refusing to overwrite non-fixture product/)

    expect(product.reload.name).to eq("Existing product")
  end
end
