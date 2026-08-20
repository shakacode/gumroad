# frozen_string_literal: true

module ProductRscHelper
  ASSET_MANIFEST_PATH = Rails.root.join("public/product-rsc/asset-manifest.json")

  def product_rsc_javascript_path
    filename = JSON.parse(ASSET_MANIFEST_PATH.read).fetch("product_rsc.js")
    "/product-rsc/#{filename}"
  end
end
