# frozen_string_literal: true

module PublicRscAssetHelpers
  def expect_public_rsc_assets(component_name)
    pack_scripts = page.all("script[src*='/public-rsc/']", visible: :all)
    sources = pack_scripts.map { _1[:src] }
    component_index = sources.index { _1.include?("/public-rsc/generated/#{component_name}.") }

    expect(component_index).not_to be_nil
    expect(sources).not_to include(a_string_matching(%r{/public-rsc/public_rsc_bootstrap\.}))
    expect(sources.count { _1.include?("/public-rsc/generated/#{component_name}.") }).to eq(1)
    expect(sources).not_to include(a_string_matching(%r{/public-rsc/product_rsc\.}))
    expect(page.evaluate_script(<<~JS)).to be(true)
      [...document.querySelectorAll("script[src*='/public-rsc/generated/#{component_name}.']")]
        .every((script) => script.async && !script.defer)
    JS
    expect(page.evaluate_script(<<~JS)).to eq([])
      [...document.querySelectorAll("script[src*='/public-rsc/']")]
        .filter((script) =>
          script.src.includes("/generated/#{component_name}.") &&
          script.nonce.length === 0
        )
        .map((script) => script.src)
    JS
  end
end
