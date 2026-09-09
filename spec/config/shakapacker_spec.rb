# frozen_string_literal: true

require "spec_helper"

describe "Public RSC Shakapacker compatibility configuration" do
  it "configures the public RSC autobundling convention" do
    expect(ReactOnRails.configuration.components_subdirectory).to eq("ror_components")
    expect(ReactOnRails.configuration.auto_load_bundle).to be(true)
    expect(ReactOnRails.configuration.generated_component_packs_loading_strategy).to eq(:async)
  end
end
