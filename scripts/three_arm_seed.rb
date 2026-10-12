# frozen_string_literal: true

# Arm-specific seed for bin/three-arm, run after scripts/seed_shakaperf_product.rb.
# Every arm gets the same data; only arm C turns on the seller flag that routes
# the product document through Pro streaming and RSC.

abort "Benchmark database required" unless Rails.env.benchmark? && ENV.fetch("DATABASE_NAME").start_with?("gumroad_shakaperf_")

arm = ENV.fetch("THREE_ARM")
seller = User.find_by!(username: "shakaperf")

begin
  EmailEngagementDynamoStore.create_table!
rescue Aws::DynamoDB::Errors::ResourceInUseException
  nil
end

if arm == "C"
  Feature.activate_user(:product_page_react_on_rails, seller)
else
  Feature.deactivate_user(:product_page_react_on_rails, seller)
end

puts({ arm: arm, seller: seller.username,
       product_page_react_on_rails: Feature.active?(:product_page_react_on_rails, seller),
       products: seller.products.count }.to_json)
