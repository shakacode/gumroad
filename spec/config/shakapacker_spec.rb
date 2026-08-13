# frozen_string_literal: true

require "spec_helper"

describe "Product RSC Shakapacker compatibility configuration" do
  it "locates the RSC bundles without compiling browser assets" do
    expect(Shakapacker.config.source_path).to eq(Rails.root.join("app/javascript"))
    expect(Shakapacker.config.public_output_path).to eq(Rails.root.join("public/product-rsc"))
    expect(Shakapacker.config.private_output_path).to eq(Rails.root.join("ssr-generated"))
    expect(Shakapacker.config.compile?).to be(false)
  end
end
