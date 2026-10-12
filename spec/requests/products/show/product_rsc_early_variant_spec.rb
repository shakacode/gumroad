# frozen_string_literal: true

require "spec_helper"

Capybara.register_driver :product_early_variant_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.args << "--headless=new" if ENV["CI"]
  options.args << "--host-resolver-rules=MAP *.test.gumroad.com 127.0.0.1,MAP test.gumroad.com 127.0.0.1"
  options.page_load_strategy = :none
  Capybara::Selenium::Driver.new(app, browser: :chrome, options:)
end

describe "First visible product variant", :product_rsc_renderer, type: :system, js: true do
  before { driven_by :product_early_variant_chrome }

  %w[desktop mobile].product(%w[simple rich], [false, true], %w[click space]).each do |profile, fixture, rsc, input|
    it "retains the first trusted #{profile} #{fixture} #{input} with RSC #{rsc ? 'on' : 'off'}" do
      seller = create(:user)
      product = create(:product, user: seller, name: "First-click #{fixture} guide", price_cents: 1200,
                                 description: "<h2>A practical guide</h2><p>Worked <strong>examples</strong>.</p>")
      category = create(:variant_category, link: product)
      create(:variant, variant_category: category, name: "Standard", price_difference_cents: 0)
      complete = create(:variant, variant_category: category, name: "Complete", price_difference_cents: 800)
      if fixture == "rich"
        section = create(:seller_profile_rich_text_section, seller:, product:, header: "What is included",
                                                            text: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "A field guide and practical examples." }] }] })
        product.update!(sections: [section.id], main_section_index: 0)
      end
      Feature.activate_user(:product_page_react_on_rails, seller) if rsc
      browser = page.driver.browser
      browser.execute_cdp("Network.enable")
      # Hold hydration so a later listener cannot rescue a lost first click.
      browser.execute_cdp("Network.setBlockedURLs", urls: ["*/public_rsc_bootstrap.*", "*://*.paypal.com/*"])
      mobile = profile == "mobile"
      browser.execute_cdp("Emulation.setDeviceMetricsOverride", width: mobile ? 390 : 1440, height: mobile ? 844 : 1000, deviceScaleFactor: 1, mobile:)
      browser.execute_cdp("Emulation.setCPUThrottlingRate", rate: mobile ? 4 : 1)
      browser.execute_cdp("Network.emulateNetworkConditions", offline: false, latency: mobile ? 150 : 40,
                                                              downloadThroughput: (mobile ? 1.6 : 20) * 1_000_000 / 8,
                                                              uploadThroughput: (mobile ? 0.75 : 5) * 1_000_000 / 8)
      url = product.long_url(layout: "profile") + "&variant=Standard"
      old_origin = page.evaluate_script("performance.timeOrigin")
      browser.execute_cdp("Page.navigate", url:)
      Timeout.timeout(30) do
        loop do
          begin
            break if page.evaluate_script("performance.timeOrigin !== arguments[0] && location.href === arguments[1]", old_origin, url)
          rescue Selenium::WebDriver::Error::JavascriptError
          end
          sleep 0.02
        end
      end
      expect(page).to have_radio_button("Complete", wait: 30)
      expect(page).to have_radio_button("Standard", checked: true)
      control = find(:radio_button, "Complete")
      if input == "space"
        control.native.send_keys(" ")
      else
        control.native.click
      end

      expect(page).to have_css('[role="radio"][aria-label="Complete"][aria-checked="true"]', wait: 15)
      selected = find('[role="radio"][aria-label="Complete"][aria-checked="true"]')
      expect(page.find_by_id(selected["aria-describedby"].split.first)).to have_text("$20")
      expect(page.evaluate_script("((element) => { const rect = element.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight; })(document.getElementById(arguments[0]))", selected["aria-describedby"].split.first)).to be(true)
      expect(Rack::Utils.parse_query(URI(find_link("Add to cart")[:href]).query)).to include("option" => complete.external_id)
      if rsc
        expect(Rack::Utils.parse_query(URI(page.current_url).query)).to include("option" => complete.external_id)
        expect(page).to have_css("#product-rsc-root", visible: :all)
      end
    ensure
      browser&.execute_cdp("Network.setBlockedURLs", urls: [])
    end
  end
end
