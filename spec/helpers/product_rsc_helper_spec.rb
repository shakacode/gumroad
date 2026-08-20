# frozen_string_literal: true

require "spec_helper"

describe ProductRscHelper do
  include described_class

  it "resolves the RSC client entry from its asset manifest" do
    manifest_path = instance_double(Pathname, read: JSON.generate("product_rsc.js" => "product_rsc.abc123.js"))
    stub_const("ProductRscHelper::ASSET_MANIFEST_PATH", manifest_path)

    expect(product_rsc_javascript_path).to eq("/product-rsc/product_rsc.abc123.js")
  end
end
