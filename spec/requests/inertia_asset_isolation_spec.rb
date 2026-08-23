# frozen_string_literal: true

require "spec_helper"

describe "Inertia asset isolation", type: :system, js: true do
  it "keeps ordinary Inertia documents on Vite without loading public RSC packs" do
    page.visit login_path

    expect(page).to have_css("#app[data-page]", visible: :all)
    expect(page).to have_no_css("script[src*='/product-rsc/']", visible: :all)
    expect(page.evaluate_script(<<~JS)).to be(false)
      performance.getEntriesByType("resource").some(({ name }) => name.includes("/product-rsc/"))
    JS
  end
end
