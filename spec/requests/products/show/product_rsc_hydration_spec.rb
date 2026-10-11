# frozen_string_literal: true

require "spec_helper"

describe "Product RSC hydration", :product_rsc_renderer, type: :system, js: true do
  let(:seller) { create(:named_user, name: "Hydration seller", disable_buyer_local_currency: false) }
  let(:currency_namespace) { Redis::Namespace.new(:currencies, redis: $redis) }

  around do |example|
    JSErrorReporter.enabled = true
    example.run
  ensure
    JSErrorReporter.enabled = nil
  end

  before do
    # Local checkout has placeholder PayPal credentials; product hydration stays strict.
    ignore_js_error %r{\AError: The script "https://www\.paypal\.com/sdk/js\?}
    Feature.activate_user(:product_page_react_on_rails, seller)
    Feature.activate(:buyer_local_currency)
    currency_namespace.del("EUR")
    allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return("2.47.255.255")
  end

  after do
    expect_no_hydration_errors
  ensure
    page.driver.browser.execute_cdp("Emulation.setTimezoneOverride", timezoneId: "")
    page.driver.browser.execute_cdp("Emulation.setLocaleOverride", locale: "")
    if @capture_script_id
      page.driver.browser.execute_cdp("Page.removeScriptToEvaluateOnNewDocument", identifier: @capture_script_id)
    end
  end

  [
    ["Pacific/Honolulu", "de-DE", "1. Januar 2030"],
    ["Pacific/Kiritimati", "fr-FR", "2 janvier 2030"],
  ].each do |time_zone, locale, local_release_day|
    it "retains preorder, price and PWYW nodes while switching to #{locale} in #{time_zone}" do
      product = create(:product, user: seller, name: "Preorder hydration guide", price_cents: 123_456,
                                 customizable_price: true, is_in_preorder_state: true)
      release_at = Time.utc(2030, 1, 2, 0, 30)
      create(:preorder_link, link: product, release_at:)
      capture_hydration(product, time_zone:, locale:, notice_text: "Available on")

      visit product.long_url(layout: Product::Layout::PROFILE)
      wait_for_product_script

      initial = initial_product_markup(product)
      expect(initial.fetch("price")).to eq("$1,234.56+")
      expect(initial.fetch("placeholder")).to eq("1,234.56+")
      expect(initial.fetch("notice")).to include("January 2, 2030")
      local_amount = browser_amount(1234.56)
      within find("article", text: product.name) do
        expect(page).to have_css("[itemprop='price']", text: localized_text("$#{local_amount}+", exact: true))
        expect(page).to have_field("Name a fair price", placeholder: localized_text("#{local_amount}+", exact: true))
        expect(page).to have_css("[role='status']", text: local_release_day)
        expected_release = page.evaluate_script(<<~JS)
          new Date(#{release_at.iso8601.to_json}).toLocaleString(#{locale.to_json}, {
            dateStyle: "long", timeStyle: "short", timeZone: #{time_zone.to_json}
          })
        JS
        expect(page).to have_css("[role='status']", text: localized_text("Available on #{expected_release}"))
      end
      expect_retained_product_nodes(product, notice: true)
      expect_no_hydration_errors

      within find("article", text: product.name) do
        fill_in "Name a fair price", with: "1234.56"
        expect(Rack::Utils.parse_query(URI(find_link("Add to cart")[:href]).query)).to include("price" => "123456")
        click_on "Add to cart"
      end
      expect_checkout_for(product)
    end
  end

  it "retains PPP price and notice nodes while formatting the buyer's percentage and amount" do
    seller.update!(purchasing_power_parity_enabled: true)
    product = create(:product, user: seller, name: "PPP hydration guide", price_cents: 123_456, quantity_enabled: true)
    PurchasingPowerParityService.new.set_factor("LV", 0.49)
    allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return("109.110.31.255")
    capture_hydration(product, time_zone: "Pacific/Kiritimati", locale: "fr-FR", notice_text: "purchasing power parity")

    visit product.long_url(layout: Product::Layout::PROFILE)
    wait_for_product_script

    initial = initial_product_markup(product)
    expect(initial.fetch("price")).to eq("$1,234.56 $604.93")
    expect(initial.fetch("notice")).to include("51%", "$604.93")
    local_percentage = page.evaluate_script('(0.51).toLocaleString(undefined, { style: "percent" })')
    within find("article", text: product.name) do
      expect(page).to have_css("[itemprop='price']", text: localized_text("$#{browser_amount(1234.56)} $#{browser_amount(604.93)}", exact: true))
      expect(page).to have_css("[role='status']", text: localized_text("discounted by #{local_percentage} to $#{browser_amount(604.93)}"))
    end
    expect_retained_product_nodes(product, notice: true)
    expect_no_hydration_errors

    within find("article", text: product.name) do
      fill_in "Quantity", with: "2"
      expect(Rack::Utils.parse_query(URI(find_link("Add to cart")[:href]).query)).to include("quantity" => "2")
      click_on "Add to cart"
    end
    expect_checkout_for(product)
    within_cart_item(product.name) { expect(page).to have_text("Qty: 2") }
  end

  it "preserves purchase controls when the browser crosses the countdown display threshold and expires the discount" do
    product = create(:product, user: seller, name: "Countdown hydration guide", price_cents: 1200, quantity_enabled: true)
    offer_code = create(:offer_code, products: [product], valid_at: 1.day.ago, expires_at: 8.days.from_now)
    capture_hydration(product, time_zone: "Pacific/Honolulu", locale: "de-DE",
                               notice_text: "off will be applied", browser_time: offer_code.expires_at - 3.seconds)

    visit product.long_url(layout: Product::Layout::PROFILE, code: offer_code.code)
    wait_for_product_script

    expect(initial_product_markup(product).fetch("notice")).not_to include("This discount expires in")
    expect(page).to have_css("[role='status']", text: "Sorry, the discount code you wish to use is inactive.")
    expect(page.evaluate_script("window.productHydration.countdownTexts")).to include(a_string_matching(/This discount expires in \d{2}:\d{2}/))
    expect_retained_product_nodes(product)
    within find("article", text: product.name) do
      expect(page).to have_css("[itemprop='price']", text: "$12", exact_text: true)
      expect(Rack::Utils.parse_query(URI(find_link("Add to cart")[:href]).query)["code"]).to be_nil
      click_on "Add to cart"
    end
    expect_checkout_for(product)
  end

  it "keeps the main discount while leaving an ordinary featured product at its full price" do
    product = create(:product, user: seller, name: "Main hydration guide", price_cents: 123_456, quantity_enabled: true)
    featured_product = create(:product, user: seller, name: "Featured hydration workbook", price_cents: 234_567, quantity_enabled: true)
    section = create(:seller_profile_featured_product_section, seller:, product:, featured_product_id: featured_product.id)
    product.update!(sections: [section.id], main_section_index: 0)
    offer_code = create(:offer_code, products: [product, featured_product], amount_cents: 10_000)
    capture_hydration(product, featured_product, time_zone: "Pacific/Honolulu", locale: "de-DE")

    visit product.long_url(layout: Product::Layout::PROFILE, code: offer_code.code)
    wait_for_product_script

    expect(initial_product_markup(product).fetch("price")).to eq("$1,234.56 $1,134.56")
    expect(initial_product_markup(featured_product).fetch("price")).to eq("$2,345.67")
    within find("article", text: product.name) do
      expect(page).to have_css("[itemprop='price']", text: "$1.234,56 $1.134,56", exact_text: true)
      expect(page).to have_css("[role='status']", text: "$100 off will be applied at checkout")
      expect(Rack::Utils.parse_query(URI(find_link("Add to cart")[:href]).query)).to include("code" => offer_code.code)
    end
    within find("article", text: featured_product.name) do
      expect(page).to have_css("[itemprop='price']", text: "$2.345,67", exact_text: true)
      expect(page).to have_no_css("[itemprop='price'] s")
      expect(page).to have_no_text("off will be applied at checkout")
    end
    expect_retained_product_nodes(product)
    expect_retained_product_nodes(featured_product)
    expect_no_hydration_errors

    within find("article", text: product.name) { click_on "Add to cart" }
    expect_checkout_for(product)
    expect(page).to have_css("[aria-label='Discount code']", text: offer_code.code)
  end

  it "localizes initial product cards like the Inertia product grid without replacing their server nodes" do
    product = create(:product, user: seller, name: "Main catalog guide", price_cents: 123_456)
    card = create(:product, user: seller, name: "Catalog workbook", price_cents: 123_456)
    Link.import(refresh: true, force: true)
    section = create(:seller_profile_products_section, seller:, product:, header: "More guides", shown_products: [card.id])
    product.update!(sections: [section.id], main_section_index: 0)
    capture_hydration(card, time_zone: "Pacific/Honolulu", locale: "de-DE")

    visit product.long_url(layout: Product::Layout::PROFILE)
    wait_for_product_script

    expect(initial_product_markup(card).fetch("price")).to eq("$1,234.56")
    within find("article", text: card.name) do
      expect(page).to have_css("[itemprop='price']", text: "$1.234,56", exact_text: true)
    end
    expect(page.evaluate_script(<<~JS)).to be(true)
      (() => {
        const saved = window.productHydration.products[#{card.name.to_json}];
        const article = [...document.querySelectorAll("#product-rsc-root article")].find(node => node.textContent.includes(#{card.name.to_json}));
        return saved.article === article && saved.price === article.querySelector('[itemprop="price"]');
      })()
    JS

    Feature.deactivate_user(:product_page_react_on_rails, seller)
    visit product.long_url(layout: Product::Layout::PROFILE)
    within find("article", text: card.name) do
      expect(page).to have_css("[itemprop='price']", text: "$1.234,56", exact_text: true)
    end
  end

  def capture_hydration(*products, time_zone:, locale:, notice_text: nil, browser_time: nil)
    page.driver.browser.execute_cdp("Emulation.setTimezoneOverride", timezoneId: time_zone)
    page.driver.browser.execute_cdp("Emulation.setLocaleOverride", locale:)
    @capture_script_id = page.driver.browser.execute_cdp("Page.addScriptToEvaluateOnNewDocument", source: <<~JS).fetch("identifier")
      window.productHydration = { loads: [], products: {}, countdownTexts: [] };
      #{"Date.now = () => #{(browser_time.to_f * 1000).to_i};" if browser_time}
      document.addEventListener("load", (event) => {
        const src = event.target.src;
        if (typeof src !== "string" || !src.includes("/public-rsc/")) return;
        window.productHydration.loads.push(src);
        if (!src.includes("/public_rsc_bootstrap.")) return;
        for (const name of #{products.map(&:name).to_json}) {
          const article = [...document.querySelectorAll("#product-rsc-root article")].find((node) => node.textContent.includes(name));
          const price = article?.querySelector('[itemprop="price"]');
          const input = article?.querySelector('input[inputmode="decimal"], input[type="number"]');
          const notice = [...(article?.querySelectorAll('[role="status"]') || [])].find((node) => #{notice_text.to_json} && node.textContent.includes(#{notice_text.to_json}));
          window.productHydration.products[name] = {
            article, price, input, notice,
            initial: { price: price?.textContent, placeholder: input?.getAttribute("placeholder"), notice: notice?.textContent }
          };
        }
        new MutationObserver(() => {
          document.querySelectorAll('#product-rsc-root [role="status"]').forEach((node) => {
            if (node.textContent.includes("This discount expires in")) window.productHydration.countdownTexts.push(node.textContent);
          });
        }).observe(document.querySelector("#product-rsc-root"), { subtree: true, childList: true, characterData: true });
      }, true);
    JS
  end

  def wait_for_product_script
    loads = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      const deadline = performance.now() + 5000;
      const check = () => {
        const loads = window.productHydration?.loads || [];
        if (loads.some((src) => src.includes("/generated/ProductPage.")) || performance.now() > deadline) done(loads);
        else requestAnimationFrame(check);
      };
      check();
    JS
    bootstrap_index = loads.index { _1.include?("/public_rsc_bootstrap.") }
    product_index = loads.index { _1.include?("/generated/ProductPage.") }
    expect(bootstrap_index).not_to be_nil
    expect(product_index).not_to be_nil
    expect(bootstrap_index).to be < product_index
  end

  def initial_product_markup(product)
    page.evaluate_script("window.productHydration.products[#{product.name.to_json}].initial")
  end

  def expect_retained_product_nodes(product, notice: false)
    retained = page.evaluate_script(<<~JS)
      (() => {
        const saved = window.productHydration.products[#{product.name.to_json}];
        const article = [...document.querySelectorAll("#product-rsc-root article")].find((node) => node.textContent.includes(#{product.name.to_json}));
        return {
          article: !!saved.article && saved.article === article,
          price: !!saved.price && saved.price === article?.querySelector('[itemprop="price"]'),
          input: !!saved.input && saved.input === article?.querySelector('input[inputmode="decimal"], input[type="number"]'),
          notice: !!saved.notice && saved.notice.isConnected && article?.contains(saved.notice)
        };
      })()
    JS
    expect(retained.slice("article", "price", "input")).to eq("article" => true, "price" => true, "input" => true)
    expect(retained.fetch("notice")).to be(true) if notice
  end

  def browser_amount(amount)
    page.evaluate_script("(#{amount}).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })")
  end

  def localized_text(text, exact: false)
    pattern = text.split(/[[:space:]\u00a0\u202f]+/).map { Regexp.escape(_1) }.join("[[:space:]\u00a0\u202f]+")
    Regexp.new(exact ? "\\A#{pattern}\\z" : pattern)
  end

  def expect_checkout_for(product)
    expect(page).to have_current_path(%r{/checkout}, ignore_query: true)
    expect(page).to have_field("Email address")
    within_cart_item(product.name) { expect(page).to have_text(product.name) }
  end

  def expect_no_hydration_errors
    errors = page.driver.browser.logs.get(:browser).select do |entry|
      entry.message.match?(/hydrat|recoverable|Minified React error/i) ||
        (entry.level == "SEVERE" && entry.message.include?("/public-rsc/"))
    end
    expect(errors.map(&:message)).to be_empty
  end
end
