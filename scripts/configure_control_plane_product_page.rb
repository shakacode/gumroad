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
    enabled = surface == "rorp"
    # Disable clears actor, group, and percentage gates left by earlier experiments.
    Feature.deactivate(:product_page_react_on_rails)
    Feature.activate(:product_page_react_on_rails) if enabled

    actual = Feature.active?(:product_page_react_on_rails, product.user)
    raise "Product-page flag mismatch: expected #{enabled}, got #{actual}" unless actual == enabled

    puts({ app: ENV.fetch("CPLN_GVC"), product: product.unique_permalink, product_page_react_on_rails: actual }.to_json)
  end
end

ControlPlaneProductPage.configure!
