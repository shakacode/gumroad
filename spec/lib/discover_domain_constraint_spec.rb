# frozen_string_literal: true

require "spec_helper"

describe DiscoverDomainConstraint do
  describe ".matches?" do
    before do
      @original_branch_deployment = ENV["BRANCH_DEPLOYMENT"]
      @original_control_plane_benchmark = ENV["CONTROL_PLANE_BENCHMARK"]
      ENV["CONTROL_PLANE_BENCHMARK"] = nil
      stub_const("VALID_DISCOVER_REQUEST_HOST", "discover.gumroad.com")
    end

    after do
      ENV["BRANCH_DEPLOYMENT"] = @original_branch_deployment
      ENV["CONTROL_PLANE_BENCHMARK"] = @original_control_plane_benchmark
    end

    it "accepts the canonical discover host" do
      request = double("request", host: "discover.gumroad.com", path: "/")

      expect(described_class.matches?(request)).to eq(true)
    end

    it "rejects non-discover hosts" do
      request = double("request", host: "gumroad.com", path: "/")

      expect(described_class.matches?(request)).to eq(false)
    end

    it "accepts explicit discover paths on a generated Control Plane Rails host" do
      ENV["BRANCH_DEPLOYMENT"] = "true"
      request = double("request", host: "rails-d98bp9qhcc8be.cpln.app", path: "/discover")

      expect(described_class.matches?(request)).to eq(true)
    end

    it "accepts taxonomy paths on a generated Control Plane Rails host" do
      ENV["BRANCH_DEPLOYMENT"] = "true"
      request = double("request", host: "rails-d98bp9qhcc8be.cpln.app", path: "/software-development/programming")
      allow(DiscoverTaxonomyConstraint).to receive(:matches?).with(request).and_return(true)

      expect(described_class.matches?(request)).to eq(true)
    end

    it "leaves the generated Control Plane root to GumroadDomainConstraint" do
      ENV["BRANCH_DEPLOYMENT"] = "true"
      request = double("request", host: "rails-d98bp9qhcc8be.cpln.app", path: "/")

      expect(described_class.matches?(request)).to eq(false)
    end

    it "accepts the benchmark custom root as the Discover host" do
      ENV["CONTROL_PLANE_BENCHMARK"] = "true"
      stub_const("VALID_DISCOVER_REQUEST_HOST", "gumroad-rorp.reactonrails.com")
      request = double("request", host: "gumroad-rorp.reactonrails.com", path: "/")

      expect(described_class.matches?(request)).to eq(true)
    end

    it "accepts explicit discover paths on the benchmark custom root" do
      ENV["CONTROL_PLANE_BENCHMARK"] = "true"
      stub_const("VALID_DISCOVER_REQUEST_HOST", "gumroad-rorp.reactonrails.com")
      request = double("request", host: "gumroad-rorp.reactonrails.com", path: "/discover")

      expect(described_class.matches?(request)).to eq(true)
    end

    it "accepts taxonomy paths on the benchmark custom root" do
      ENV["CONTROL_PLANE_BENCHMARK"] = "true"
      stub_const("VALID_DISCOVER_REQUEST_HOST", "gumroad-rorp.reactonrails.com")
      request = double("request", host: "gumroad-rorp.reactonrails.com", path: "/software-development/programming")
      allow(DiscoverTaxonomyConstraint).to receive(:matches?).with(request).and_return(true)

      expect(described_class.matches?(request)).to eq(true)
    end

    it "accepts product support paths on the benchmark custom root" do
      ENV["CONTROL_PLANE_BENCHMARK"] = "true"
      stub_const("VALID_DISCOVER_REQUEST_HOST", "gumroad-rorp.reactonrails.com")
      allow(DiscoverTaxonomyConstraint).to receive(:matches?).and_return(false)

      [
        "/links/example/increment_views",
        "/links/example/track_user_action",
        "/offer_codes/compute_discount",
      ].each do |path|
        request = double("request", host: "gumroad-rorp.reactonrails.com", path: path)
        expect(described_class.matches?(request)).to eq(true)
      end
    end

    it "accepts product support paths on a generated Control Plane Rails host" do
      ENV["BRANCH_DEPLOYMENT"] = "true"
      allow(DiscoverTaxonomyConstraint).to receive(:matches?).and_return(false)

      [
        "/links/example/increment_views",
        "/links/example/track_user_action",
        "/offer_codes/compute_discount",
      ].each do |path|
        request = double("request", host: "rails-d98bp9qhcc8be.cpln.app", path: path)
        expect(described_class.matches?(request)).to eq(true)
      end
    end

    it "does not treat the benchmark seller host as Discover" do
      ENV["CONTROL_PLANE_BENCHMARK"] = "true"
      stub_const("VALID_DISCOVER_REQUEST_HOST", "gumroad-rorp.reactonrails.com")
      request = double("request", host: "seller.gumroad-rorp.reactonrails.com", path: "/discover")

      expect(described_class.matches?(request)).to eq(false)
    end

    it "rejects generated Control Plane hosts when branch deployment routing is disabled" do
      ENV["BRANCH_DEPLOYMENT"] = nil
      request = double("request", host: "rails-d98bp9qhcc8be.cpln.app", path: "/discover")

      expect(described_class.matches?(request)).to eq(false)
    end
  end
end
