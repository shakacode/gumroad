# frozen_string_literal: true

require "spec_helper"

describe GumroadDomainConstraint do
  describe ".matches?" do
    before do
      @gumroad_domain_request = double("request")
      allow(@gumroad_domain_request).to receive(:host).and_return("gumroad.com")

      @non_gumroad_domain_request = double("request")
      allow(@non_gumroad_domain_request).to receive(:host).and_return("api.gumroad.com")

      stub_const("VALID_REQUEST_HOSTS", ["gumroad.com"])
    end

    context "when requests come from Gumroad root domain" do
      it "returns true" do
        expect(described_class.matches?(@gumroad_domain_request)).to eq(true)
      end
    end

    it "accepts the configured benchmark root host" do
      stub_const("VALID_REQUEST_HOSTS", ["gumroad-inertia.reactonrails.com"])
      request = double("request", host: "gumroad-inertia.reactonrails.com")

      expect(described_class.matches?(request)).to eq(true)
    end

    context "when requests come from non-Gumroad root domain" do
      it "returns false" do
        expect(described_class.matches?(@non_gumroad_domain_request)).to eq(false)
      end
    end

    context "when requests come from a Control Plane Rails workload host" do
      before do
        @original_branch_deployment = ENV["BRANCH_DEPLOYMENT"]
        ENV["BRANCH_DEPLOYMENT"] = "true"
      end

      after do
        ENV["BRANCH_DEPLOYMENT"] = @original_branch_deployment
      end

      it "accepts the generated Rails host" do
        allow(@non_gumroad_domain_request).to receive(:host).and_return("rails-d7fsgnq0evscp.cpln.app")

        expect(described_class.matches?(@non_gumroad_domain_request)).to eq(true)
      end

      it "rejects other Control Plane and lookalike hosts" do
        %w[renderer-d7fsgnq0evscp.cpln.app rails-example.cpln.app.attacker.test rails_example.cpln.app].each do |host|
          allow(@non_gumroad_domain_request).to receive(:host).and_return(host)
          expect(described_class.matches?(@non_gumroad_domain_request)).to eq(false)
        end
      end
    end
  end
end
