# frozen_string_literal: true

require "spec_helper"

describe "Public RSC Shakapacker compatibility configuration" do
  it "locates the RSC bundles without compiling browser assets" do
    expect(Shakapacker.config.source_path).to eq(Rails.root.join("app/javascript"))
    expect(Shakapacker.config.source_entry_path).to eq(Rails.root.join("app/javascript/packs/public_rsc"))
    expect(Shakapacker.config.public_output_path).to eq(Rails.root.join("public/product-rsc"))
    expect(Shakapacker.config.private_output_path).to eq(Rails.root.join("ssr-generated"))
    expect(Shakapacker.config.assets_bundler).to eq("rspack")
    expect(Shakapacker.config.nested_entries?).to be(true)
    expect(Shakapacker.config.precompile_hook).to eq("rake react_on_rails:generate_packs")
    expect(Shakapacker.config.compile?).to be(false)
  end

  it "configures the public RSC autobundling convention" do
    expect(ReactOnRails.configuration.components_subdirectory).to eq("ror_components")
    expect(ReactOnRails.configuration.auto_load_bundle).to be(true)
    expect(ReactOnRails.configuration.generated_component_packs_loading_strategy).to eq(:async)
  end
end
