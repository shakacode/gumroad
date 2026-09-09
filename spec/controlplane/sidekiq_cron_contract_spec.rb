# frozen_string_literal: true

require "pathname"
require "sidekiq"
require "yaml"

RSpec.describe "Control Plane benchmark Sidekiq cron" do
  def root
    Pathname.new(__dir__).join("../..").expand_path
  end

  it "does not load the production schedule" do
    original = ENV["CONTROL_PLANE_BENCHMARK"]
    ENV["CONTROL_PLANE_BENCHMARK"] = "true"
    config = double
    startup = nil
    stub_const("Rails", Class.new)
    allow(Rails).to receive(:root).and_return(root)
    allow(config).to receive(:on).with(:startup) { |&block| startup = block }
    allow(Sidekiq).to receive(:configure_server).and_yield(config)
    expect(YAML).not_to receive(:load_file)

    load root.join("config/initializers/sidekiq_cron.rb")
    startup.call
  ensure
    ENV["CONTROL_PLANE_BENCHMARK"] = original
  end

  it "preserves production schedule loading outside the benchmark" do
    original = ENV.delete("CONTROL_PLANE_BENCHMARK")
    config = double
    startup = nil
    schedule = { "scheduled_job" => { "cron" => "0 * * * *" } }
    job = Class.new
    cron = Module.new
    cron.const_set(:Job, job)
    stub_const("Rails", Class.new)
    stub_const("Sidekiq::Cron", cron)
    allow(Rails).to receive(:root).and_return(root)
    allow(config).to receive(:on).with(:startup) { |&block| startup = block }
    allow(Sidekiq).to receive(:configure_server).and_yield(config)
    expect(YAML).to receive(:load_file).with(root.join("config/sidekiq_schedule.yml")).and_return(schedule)
    expect(job).to receive(:load_from_hash!).with(schedule, source: "schedule")

    load root.join("config/initializers/sidekiq_cron.rb")
    startup.call
  ensure
    ENV["CONTROL_PLANE_BENCHMARK"] = original
  end
end
