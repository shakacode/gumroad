# frozen_string_literal: true

require "spec_helper"

RSpec.shared_context "with Control Plane canonical hosts" do
  before do
    stub_const("ROOT_DOMAIN", "gumroad-inertia.reactonrails.com")
    stub_const("VALID_REQUEST_HOSTS", ["gumroad-inertia.reactonrails.com"])
    @original_branch_deployment = ENV["BRANCH_DEPLOYMENT"]
    ENV["BRANCH_DEPLOYMENT"] = "true"
    @request.host = "rails-example.cpln.app"
    allow(controller).to receive(:show) { controller.head :ok }
  end

  after do
    ENV["BRANCH_DEPLOYMENT"] = @original_branch_deployment
  end
end

RSpec.describe UsersController do
  include_context "with Control Plane canonical hosts"

  let!(:seller) { create(:user, username: "seller") }

  it "serves /seller on a generated Rails host" do
    get :show, params: { username: seller.username }

    expect(response).to be_successful
    expect(response.headers).not_to include("Location")
    expect(UserCustomDomainRequestService.valid?(@request)).to be(false)
  end

  it "keeps the canonical redirect on the final root host" do
    @request.host = "gumroad-inertia.reactonrails.com"

    get :show, params: { username: seller.username }

    expect(response).to redirect_to("http://seller.gumroad-inertia.reactonrails.com/")
  end

  it "does not exempt a generated host when branch deployment is unset" do
    ENV["BRANCH_DEPLOYMENT"] = nil
    stub_const("VALID_REQUEST_HOSTS", ["rails-example.cpln.app"])

    get :show, params: { username: seller.username }

    expect(response).to redirect_to("http://seller.gumroad-inertia.reactonrails.com/")
  end

  it "does not exempt a non-Rails Control Plane host" do
    @request.host = "renderer-example.cpln.app"
    stub_const("VALID_REQUEST_HOSTS", ["renderer-example.cpln.app"])

    get :show, params: { username: seller.username }

    expect(response).to redirect_to("http://seller.gumroad-inertia.reactonrails.com/")
  end
end

RSpec.describe LinksController do
  include_context "with Control Plane canonical hosts"

  let!(:seller) { create(:user, username: "seller") }
  let!(:product) do
    create(:product, user: seller).tap { _1.update_column(:unique_permalink, "O365IT") }
  end

  it "serves /l/O365IT?layout=discover on a generated Rails host" do
    get :show, params: { id: product.unique_permalink, layout: "discover" }

    expect(response).to be_successful
    expect(response.headers).not_to include("Location")
  end

  it "keeps the canonical redirect on the final root host" do
    @request.host = "gumroad-inertia.reactonrails.com"

    get :show, params: { id: product.unique_permalink, layout: "discover" }

    expect(response).to redirect_to("http://seller.gumroad-inertia.reactonrails.com/l/O365IT?layout=discover")
  end

  it "does not exempt a generated host when branch deployment is unset" do
    ENV["BRANCH_DEPLOYMENT"] = nil
    stub_const("VALID_REQUEST_HOSTS", ["rails-example.cpln.app"])

    get :show, params: { id: product.unique_permalink, layout: "discover" }

    expect(response).to redirect_to("http://seller.gumroad-inertia.reactonrails.com/l/O365IT?layout=discover")
  end

  it "does not exempt a non-Rails Control Plane host" do
    @request.host = "renderer-example.cpln.app"
    stub_const("VALID_REQUEST_HOSTS", ["renderer-example.cpln.app"])

    get :show, params: { id: product.unique_permalink, layout: "discover" }

    expect(response).to redirect_to("http://seller.gumroad-inertia.reactonrails.com/l/O365IT?layout=discover")
  end
end
