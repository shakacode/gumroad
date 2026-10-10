# frozen_string_literal: true

require "spec_helper"

describe ApplicationHelper, type: :helper do
  describe "#vite_entrypoint_stylesheet_tag" do
    let(:stylesheet) { "/vite/assets/design-test.css" }
    let(:asset_file) { Rails.public_path.join("vite/assets/design-test.css") }
    let(:css) { 'body{color:red;background:url(/images/logo.svg)}@font-face{src:url("../fonts/test.woff2")}' }

    before do
      ApplicationHelper::INLINE_STYLESHEET_CACHE.clear
      allow(File).to receive(:read).and_call_original
      allow(ViteRuby.instance.manifest).to receive(:resolve_entries).with("design", type: :typescript)
        .and_return(stylesheets: [stylesheet])
      allow(helper).to receive(:stylesheet_path).with(stylesheet, extname: false)
        .and_return("https://assets.example.com#{stylesheet}")
      allow(File).to receive(:read).with(asset_file).and_return(css)
      allow(helper).to receive(:content_security_policy_nonce).and_return("test-nonce")
    end

    it "delivers the complete stylesheet inline with its original asset URLs and no stylesheet link" do
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      document = Nokogiri::HTML.fragment(result)
      expect(document.css("link")).to be_empty
      expect(document.at_css("style")["nonce"]).to eq("test-nonce")
      expect(document.at_css("style").content).to eq('body{color:red;background:url("https://assets.example.com/images/logo.svg")}@font-face{src:url("https://assets.example.com/vite/fonts/test.woff2")}')
      expect(helper.response.headers["Link"]).to be_nil
    end

    it "keeps ordinary documents on the existing external stylesheet path" do
      expect(File).not_to receive(:read)
      expect(helper).to receive(:stylesheet_link_tag).with(stylesheet, extname: false).and_return("external styles")
      expect(helper.vite_entrypoint_stylesheet_tag("design")).to eq("external styles")
    end

    it "keeps the dev-server fallback when there are no built stylesheets" do
      allow(ViteRuby.instance.manifest).to receive(:resolve_entries).and_return(stylesheets: [])
      expect(File).not_to receive(:read)
      expect(helper).to receive(:vite_stylesheet_tag).with("entrypoints/design.scss", extname: false).and_return("dev styles")
      expect(helper.vite_entrypoint_stylesheet_tag("design", inline: true)).to eq("dev styles")
    end

    it "preserves comments, content strings, data URLs, fragments, and absolute URLs" do
      unchanged = '/* url(/comment) */a{content:"url(/string)";a:url(data:image/png;base64,abc);b:url(#mask);c:url(https://other.example.com/a);d:url(//other.example.com/b)}'
      allow(File).to receive(:read).with(asset_file).and_return(unchanged)
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      expect(Nokogiri::HTML.fragment(result).at_css("style").content).to eq(unchanged)
    end

    it "resolves escaped and quoted URLs inside nested CSS without changing other declarations" do
      allow(File).to receive(:read).with(asset_file).and_return('@media(width>1px){a{/*comment*/a:URL( "../an image.svg?q=1#mask");b:url(/font\\73/test.woff2)}}')
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      expect(Nokogiri::HTML.fragment(result).at_css("style").content).to eq('@media(width>1px){a{/*comment*/a:URL( "https://assets.example.com/vite/an%20image.svg?q=1#mask");b:url("https://assets.example.com/fonts/test.woff2")}}')
    end

    it "keeps imported stylesheets relative to the original stylesheet" do
      allow(File).to receive(:read).with(asset_file).and_return('@import "../shared.css" screen;')
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      expect(Nokogiri::HTML.fragment(result).at_css("style").content).to eq('@import "https://assets.example.com/vite/shared.css" screen;')
    end

    it "preserves percent-encoded paths, query values, and fragment delimiters" do
      allow(File).to receive(:read).with(asset_file).and_return('a{background:url("../image%20one.svg?q=two%20three#mask")}')
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      expect(Nokogiri::HTML.fragment(result).at_css("style").content).to eq('a{background:url("https://assets.example.com/vite/image%20one.svg?q=two%20three#mask")}')
    end

    it "preserves multiple query parameters when HTML-safe JSON encoding is enabled" do
      allow(File).to receive(:read).with(asset_file).and_return('a{background:url("../image.svg?v=1&color=blue")}')
      previous = ActiveSupport::JSON::Encoding.escape_html_entities_in_json
      ActiveSupport::JSON::Encoding.escape_html_entities_in_json = true
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      expect(Nokogiri::HTML.fragment(result).at_css("style").content).to eq('a{background:url("https://assets.example.com/vite/image.svg?v=1&color=blue")}')
    ensure
      ActiveSupport::JSON::Encoding.escape_html_entities_in_json = previous
    end

    it "does not allow stylesheet text to close the style element" do
      allow(File).to receive(:read).with(asset_file).and_return('a{content:"</STYLE><script>alert(1)</script>"}')
      document = Nokogiri::HTML.fragment(helper.vite_entrypoint_stylesheet_tag("design", inline: true))
      expect(document.css("script")).to be_empty
      expect(document.at_css("style").content).to include('<\\/STYLE>')
    end

    it "reads and transforms an immutable asset once per host" do
      expect(File).to receive(:read).with(asset_file).once.and_return(css)
      2.times { helper.vite_entrypoint_stylesheet_tag("design", inline: true) }
    end

    it "does not reuse rebased content across asset hosts" do
      helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      allow(helper).to receive(:stylesheet_path).with(stylesheet, extname: false)
        .and_return("https://other.example.com#{stylesheet}")
      result = helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      expect(result).to include("https://other.example.com/images/logo.svg")
      expect(result).not_to include("https://assets.example.com")
    end

    it "reads the newly fingerprinted asset after a manifest change" do
      helper.vite_entrypoint_stylesheet_tag("design", inline: true)
      allow(ViteRuby.instance.manifest).to receive(:resolve_entries).and_return(stylesheets: ["/vite/assets/design-next.css"])
      allow(helper).to receive(:stylesheet_path).with("/vite/assets/design-next.css", extname: false).and_return("/vite/assets/design-next.css")
      expect(File).to receive(:read).with(Rails.public_path.join("vite/assets/design-next.css")).and_return("body{color:blue}")
      expect(helper.vite_entrypoint_stylesheet_tag("design", inline: true)).to include("body{color:blue}")
    end

    it "falls back to the normal tag when a built stylesheet is unavailable" do
      allow(File).to receive(:read).with(asset_file).and_raise(Errno::ENOENT)
      expect(helper).to receive(:stylesheet_link_tag).with(stylesheet, extname: false).and_return("external styles")
      expect(helper.vite_entrypoint_stylesheet_tag("design", inline: true)).to eq("external styles")
    end

    it "does not read paths outside the public directory" do
      allow(ViteRuby.instance.manifest).to receive(:resolve_entries).and_return(stylesheets: ["/../private.css"])
      expect(File).not_to receive(:read)
      expect(helper).to receive(:stylesheet_link_tag).with("/../private.css", extname: false).and_return("external styles")
      expect(helper.vite_entrypoint_stylesheet_tag("design", inline: true)).to eq("external styles")
    end

    context "when rendering the document head" do
      before do
        stub_const("FACEBOOK_OG_NAMESPACE", "test")
        stub_const("CDN_S3_PROXY_HOST", nil)
        stub_const("PUBLIC_STORAGE_CDN_S3_PROXY_HOST", nil)
        allow(Rails).to receive(:public_path).and_return(Pathname.new(File.expand_path("../../public", __dir__)))
        allow(Rails).to receive(:application).and_return(double(root: Pathname.new(File.expand_path("../..", __dir__)), config: double(asset_host: nil, root: Pathname.new(File.expand_path("../..", __dir__)))))
        allow(helper).to receive_messages(action_cable_meta_tag: "", vite_client_tag: "", vite_react_refresh_tag: "", erb_meta_tags: "", inertia_meta_tags: "", inertia_rendering?: true)
        allow(SecureHeaders).to receive(:content_security_policy_script_nonce).and_return("test-nonce")
      end

      it "inlines styles only for the RSC product document" do
        helper.instance_variable_set(:@product_rsc_document_props, { id: "product" })
        html = helper.render(inline: File.read(File.expand_path("../../app/views/layouts/application/_head.html.erb", __dir__)))
        expect(Nokogiri::HTML.fragment(html).css("style").size).to eq(1)
        expect(Nokogiri::HTML.fragment(html).css('link[rel="stylesheet"]')).to be_empty
        expect(helper.response.headers["Link"]).to be_nil
      end

      it "keeps Inertia documents on the external stylesheet" do
        html = helper.render(inline: File.read(File.expand_path("../../app/views/layouts/application/_head.html.erb", __dir__)))
        expect(Nokogiri::HTML.fragment(html).css("style")).to be_empty
        expect(Nokogiri::HTML.fragment(html).css('link[rel="stylesheet"]').size).to eq(1)
      end
    end
  end
end
