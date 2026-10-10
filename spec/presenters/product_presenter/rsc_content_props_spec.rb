# frozen_string_literal: true

require "spec_helper"

describe ProductPresenter::RscContentProps do
  let(:description) { '<p>Learn more <a href="mailto:author@example.com">by email</a>.</p><img src="/first.webp"><figure><img src="/sample.webp" alt="Sample" width="640" height="480"></figure>' }
  let(:product_props) { { description_html: description, price_cents: 100, options: [], recurrences: nil, covers: [{ url: "/cover.webp" }] } }
  subject(:props) { described_class.new(product_props:).props }

  it "renders ordinary links with the same target and rel as the rich-text client" do
    link = Nokogiri::HTML.fragment(props.fetch(:description_html)).at_css("a")
    expect(link["href"]).to eq("mailto:author@example.com")
    expect(link.text).to eq("by email")
    expect(link["target"]).to eq("_blank")
    expect(link["rel"]).to eq("noopener noreferrer nofollow")
  end

  it "defers description images while retaining their content and dimensions" do
    image = Nokogiri::HTML.fragment(props.fetch(:description_html)).at_css('img[src="/sample.webp"]')
    expect(image.attributes.transform_values(&:value)).to include(
      "loading" => "lazy", "src" => "/sample.webp", "alt" => "Sample", "width" => "640", "height" => "480"
    )
  end

  it "leaves the first description image eager in case it is visible below a short cover" do
    expect(Nokogiri::HTML.fragment(props.fetch(:description_html)).at_css("img")["loading"]).to be_nil
  end

  it "normalizes links without deferring images when the product has no cover" do
    product_props[:covers] = []
    document = Nokogiri::HTML.fragment(props.fetch(:description_html))
    expect(document.at_css("a")["target"]).to eq("_blank")
    expect(document.css("img[loading]")).to be_empty
  end

  it "preserves an explicit image loading preference" do
    product_props[:description_html] = '<img src="/eager.webp" loading="eager"><img src="/lazy.webp" loading="lazy">'
    expect(Nokogiri::HTML.fragment(props.fetch(:description_html)).css("img").map { _1["loading"] }).to eq(%w[eager lazy])
  end

  it "leaves the original product props available to the client and Inertia" do
    original = description.dup.freeze
    product_props[:description_html] = original
    product_props.freeze
    expect(props.fetch(:description_html)).not_to eq(original)
    expect(product_props.fetch(:description_html)).to equal(original)
  end

  it "preserves link destinations, nested text, and custom attributes" do
    product_props[:description_html] = '<a href="/guide?a=1&amp;b=2#sample" class="tiptap__button" title="Guide" target="_self"><strong>Read</strong></a>'
    link = Nokogiri::HTML.fragment(props.fetch(:description_html)).at_css("a")
    expect(link["href"]).to eq("/guide?a=1&b=2#sample")
    expect(link["class"]).to eq("tiptap__button")
    expect(link["title"]).to eq("Guide")
    expect(link.at_css("strong").text).to eq("Read")
    expect(link["target"]).to eq("_blank")
  end

  it "preserves additional relationship tokens on links that are already static" do
    product_props[:description_html] = '<a href="/guide" target="_blank" rel="sponsored noopener noreferrer NOFOLLOW">Read</a>'
    link = Nokogiri::HTML.fragment(props.fetch(:description_html)).at_css("a")
    expect(link["rel"]).to eq("sponsored noopener noreferrer NOFOLLOW")
  end

  [nil, ""].each do |empty_description|
    it "preserves #{empty_description.inspect} descriptions" do
      product_props[:description_html] = empty_description
      expect(props.fetch(:description_html)).to eq(empty_description)
    end
  end

  %w[pre public-file-embed review-card upsell-card].each do |tag|
    it "leaves descriptions with #{tag} for their existing client enhancement" do
      html = "<#{tag}>Interactive content</#{tag}>#{description}"
      product_props[:description_html] = html
      expect(props.fetch(:description_html)).to eq(html)
    end
  end

  it "leaves anchors without a destination on the existing enhancement path" do
    html = '<a id="chapter">Chapter</a><img src="/sample.webp">'
    product_props[:description_html] = html
    expect(props.fetch(:description_html)).to eq(html)
  end
end
