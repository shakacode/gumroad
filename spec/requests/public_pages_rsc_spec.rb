# frozen_string_literal: true

require "spec_helper"

describe "Public page React on Rails rendering", :product_rsc_renderer, :elasticsearch_wait_for_refresh, type: :system, js: true do
  around do |example|
    JSErrorReporter.enabled = true
    example.run
  ensure
    JSErrorReporter.enabled = nil
  end

  def expect_rsc_document(root_id:, component_name:)
    expect(page).to have_css("##{root_id}")
    expect_public_rsc_assets(component_name)
    expect(page).to have_css(
      "script.js-react-on-rails-component[data-component-name='#{component_name}'][data-dom-id='#{root_id}']",
      visible: :all
    )
    expect(page).to have_no_css("#app[data-page]", visible: :all)
    expect(page).to have_css('script[data-react-on-rails-rsc-payload="true"]', visible: :all)
    expect(page.evaluate_script(<<~JS)).to be(true)
      [...document.querySelectorAll('script[data-react-on-rails-rsc-payload="true"]')]
        .every((script) => script.nonce.length > 0)
    JS
    expect(page.evaluate_script(<<~JS)).to be(false)
      performance.getEntriesByType("resource").some(({ name }) => name.includes("/rsc_payload/"))
    JS
  end
end

describe ProductRscRenderer do
  it "passes the configured password to the spawned renderer" do
    allow(ReactOnRailsPro.configuration).to receive(:renderer_password).and_return("custom-renderer-password")
    allow(described_class).to receive(:healthy?).and_return(false, true)
    allow(Process).to receive(:waitpid).with(123, Process::WNOHANG).and_return(nil)
    allow(Process).to receive(:kill).with("TERM", 123)
    allow(Process).to receive(:wait).with(123)
    expect(Process).to receive(:spawn) do |environment, *_arguments|
      expect(environment.fetch("RENDERER_PASSWORD")).to eq("custom-renderer-password")
      123
    end

    described_class.with_running_renderer { }
  end

  it "rejects a healthy renderer that was already using the configured port" do
    allow(described_class).to receive(:healthy?).and_return(true)
    expect(Process).not_to receive(:spawn)

    expect { described_class.with_running_renderer }.to raise_error(/already running/)
  end

  it "rejects a spawned renderer that exited before a healthy response" do
    allow(described_class).to receive(:healthy?).and_return(true)
    allow(Process).to receive(:waitpid).with(123, Process::WNOHANG).and_return(123)

    expect { described_class.wait_until_healthy(123) }.to raise_error(/exited before it became healthy/)
  end
end
