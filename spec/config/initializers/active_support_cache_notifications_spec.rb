# frozen_string_literal: true

require "spec_helper"

describe "cache read metrics" do
  it "ignores composite cache keys" do
    expect do
      ActiveSupport::Notifications.instrument("cache_read.active_support", key: ["react-on-rails", "rsc-bundle"], hit: true)
    end.not_to raise_error
  end
end
