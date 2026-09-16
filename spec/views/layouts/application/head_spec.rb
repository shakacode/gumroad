# frozen_string_literal: true

require "spec_helper"

describe "layouts/application/_head", type: :view do
  let(:meta_controller) { ApplicationController.new }

  before do
    meta_controller.send(:set_meta_tag, name: "csrf-token", content: 'token"&<escaped>')
    meta_controller.send(:set_meta_tag, property: "stripe:pk", value: "pk_test")
    assign(:hide_styles, true)
    allow(view).to receive(:action_cable_meta_tag).and_return("")
    allow(view).to receive(:vite_client_tag).and_return("")
    allow(view).to receive(:vite_react_refresh_tag).and_return("")
    allow(view).to receive(:inertia_rendering?).and_return(true)
    allow(view).to receive(:inertia_page).and_return(props: { _inertia_meta: meta_controller.inertia_meta.meta_tags })
    allow(view).to receive(:inertia_meta_tags).and_call_original
    allow(view).to receive(:erb_meta_tags) { |**options| meta_controller.send(:erb_meta_tags, **options) }
  end

  it "keeps RSC document metadata outside Inertia head ownership" do
    assign(:product_rsc_document_props, { product: {} })

    render partial: "layouts/application/head"

    document = Nokogiri::HTML(rendered)
    expect(document.css('meta[name="csrf-token"]').length).to eq(1)
    expect(document.at_css('meta[name="csrf-token"]')["content"]).to eq('token"&<escaped>')
    expect(document.css('meta[property="stripe:pk"]').length).to eq(1)
    expect(document.css("[inertia], [data-inertia]")).to be_empty
    expect(view).not_to have_received(:inertia_meta_tags)
  end

  it "preserves Inertia head ownership for existing Inertia documents" do
    render partial: "layouts/application/head"

    expect(Nokogiri::HTML(rendered).at_css('meta[name="csrf-token"]')["inertia"]).to be_present
    expect(view).not_to have_received(:erb_meta_tags)
  end
end
