# frozen_string_literal: true

require "spec_helper"

RSpec.describe "Active Storage proxy routing" do
  before do
    @original_branch_deployment = ENV["BRANCH_DEPLOYMENT"]
    ENV["BRANCH_DEPLOYMENT"] = "true"
  end

  after do
    ENV["BRANCH_DEPLOYMENT"] = @original_branch_deployment
  end

  it "recognizes blob proxy URLs before storefront catch-alls on every benchmark host" do
    hosts = [
      "gumroad-rorp.reactonrails.com",
      "rails-example.cpln.app",
      "seller.gumroad-rorp.reactonrails.com",
    ]

    hosts.each do |host|
      route = Rails.application.routes.recognize_path(
        "https://#{host}/rails/active_storage/blobs/proxy/example/file.png",
        method: :get
      )

      expect(route).to include(
        controller: "active_storage/blobs/proxy",
        action: "show",
        signed_id: "example",
        filename: "file",
        format: "png"
      )
    end
  end

  it "recognizes representation proxy URLs before storefront catch-alls" do
    route = Rails.application.routes.recognize_path(
      "https://gumroad-rorp.reactonrails.com/rails/active_storage/representations/proxy/blob/variation/file.png",
      method: :get
    )

    expect(route).to include(
      controller: "active_storage/representations/proxy",
      action: "show",
      signed_blob_id: "blob",
      variation_key: "variation",
      filename: "file",
      format: "png"
    )
  end
end
