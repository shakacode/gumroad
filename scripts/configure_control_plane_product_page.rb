# frozen_string_literal: true

module ControlPlaneProductPage
  module_function

  def configure!
    surface = ENV.fetch("GUMROAD_RENDERING_SURFACE")
    unless Rails.env.benchmark? && ENV["CONTROL_PLANE_BENCHMARK"] == "true" &&
        %w[inertia rorp].include?(surface) && ENV["CPLN_GVC"] == "gumroad-#{surface}"
      raise "Product-page flag configuration requires a matching Control Plane benchmark app"
    end

    product = Link.find_by!(unique_permalink: "bgfjk")
    seller = product.user
    raise "Expected seller luisfurushio" unless seller.username == "luisfurushio"

    feature = Flipper[:product_page_react_on_rails]
    gates = feature.gate_values
    if gates.boolean || gates.groups.any? || gates.percentage_of_actors.positive? ||
        gates.percentage_of_time.positive? || gates.expression ||
        (gates.actors - [seller.flipper_id]).any?
      raise "Existing product-page gates must be reconciled before the seller-only comparison"
    end
    enabled = surface == "rorp"
    if enabled
      Feature.activate_user(:product_page_react_on_rails, seller)
    else
      Feature.deactivate_user(:product_page_react_on_rails, seller)
    end

    actual = Feature.active?(:product_page_react_on_rails, seller)
    raise "Product-page flag mismatch: expected #{enabled}, got #{actual}" unless actual == enabled
    raise "Product-page flag was enabled globally" if Feature.active?(:product_page_react_on_rails)

    puts({ app: ENV.fetch("CPLN_GVC"), product: product.unique_permalink, seller: seller.username,
           product_page_react_on_rails: actual, global: false }.to_json)
  end
end

ControlPlaneProductPage.configure!
