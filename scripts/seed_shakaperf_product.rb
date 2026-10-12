# frozen_string_literal: true

abort "Disposable ShakaPerf development or benchmark database required" unless (Rails.env.development? || Rails.env.benchmark?) && ENV.fetch("DATABASE_NAME").start_with?("gumroad_shakaperf_")
abort "Loopback database required" unless ActiveRecord::Base.connection_db_config.host == "127.0.0.1"

Purchase.__elasticsearch__.create_index! unless Purchase.__elasticsearch__.index_exists?

fixed_time = Time.utc(2026, 1, 1)
seller = User.find_or_initialize_by(email: "shakaperf@example.com")
seller.assign_attributes(username: "shakaperf", name: "Sample seller", confirmed_at: fixed_time,
                         created_at: fixed_time, user_risk_state: "compliant", password: "local-fixture-only-Example123!")
seller.save!
product = seller.products.find_or_initialize_by(unique_permalink: "shakaperf")
product.assign_attributes(name: "ShakaPerf sample guide", price_cents: 1000, created_at: fixed_time,
                          description: "<p>A synthetic guide for repeatable local checks.</p>", draft: false)
product.prices.build(price_cents: product.price_cents, recurrence: 0) if product.prices.empty?
product.save!
abort "Fixture is not published" unless product.reload.published?
puts({ product: product.unique_permalink, price_cents: product.price_cents, seller: seller.username, products: seller.products.count }.to_json)
