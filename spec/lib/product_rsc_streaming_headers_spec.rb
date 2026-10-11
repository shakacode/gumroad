# frozen_string_literal: true

require "spec_helper"

describe ProductRscStreamingHeaders do
  def middleware(app)
    Rack::ConditionalGet.new(described_class.new(Rack::ETag.new(app)))
  end

  it "keeps a Live body lazy while removing its temporary freshness header" do
    body = double("Live body", to_ary: [])
    expect(body).not_to receive(:to_ary)
    headers = { "last-modified" => Time.current.httpdate, "cache-control" => "no-store" }
    app = ->(env) { env["gumroad.product_rsc_streaming"] = true; [200, headers, body] }

    status, returned_headers, returned_body = middleware(app).call("REQUEST_METHOD" => "GET", "HTTP_IF_MODIFIED_SINCE" => 1.day.from_now.httpdate)

    expect(status).to eq(200)
    expect(returned_headers).not_to have_key("last-modified")
    expect(returned_headers).not_to have_key("etag")
    expect(returned_body).to equal(body)
  end

  it "preserves ordinary conditional responses" do
    headers = { "last-modified" => Time.current.httpdate }
    app = ->(_env) { [200, headers, ["ordinary response"]] }

    status, returned_headers, body = middleware(app).call("REQUEST_METHOD" => "GET", "HTTP_IF_MODIFIED_SINCE" => 1.day.from_now.httpdate)

    expect(status).to eq(304)
    expect(returned_headers["last-modified"]).to be_present
    expect(body).to be_empty
  end
end
