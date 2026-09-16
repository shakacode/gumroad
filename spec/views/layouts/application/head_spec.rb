# frozen_string_literal: true

require "spec_helper"

describe "layouts/application/_head", type: :view do
  let(:meta_controller) { ApplicationController.new }

  before do
    meta_controller.send(:set_meta_tag, name: "csrf-token", content: 'token"&<escaped>')
    meta_controller.send(:set_meta_tag, property: "stripe:pk", value: "pk_test")
    meta_controller.send(:set_meta_tag, tag_name: "style", inner_content: 'body{font-family:"ABC Favorit",sans-serif}', head_key: "custom_styles")
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
    expect(document.at_css("style").content).to eq('body{font-family:"ABC Favorit",sans-serif}')
    expect(view).not_to have_received(:inertia_meta_tags)
  end

  it "keeps a style closing-tag sequence inside the RSC style body" do
    assign(:product_rsc_document_props, { product: {} })
    meta_controller.send(:set_meta_tag, tag_name: "style", inner_content: "</style><script>alert(1)</script>", head_key: "custom_styles")

    render partial: "layouts/application/head"

    document = Nokogiri::HTML(rendered)
    expect(document.css("script")).to be_empty
    expect(document.at_css("style").content).to eq('<\\/style><script>alert(1)</script>')
  end

  it "preserves Inertia head ownership for existing Inertia documents" do
    render partial: "layouts/application/head"

    expect(Nokogiri::HTML(rendered).at_css('meta[name="csrf-token"]')["inertia"]).to be_present
    expect(view).not_to have_received(:erb_meta_tags)
  end
end
