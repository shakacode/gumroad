# frozen_string_literal: true

require "fileutils"
require "open3"
require "pathname"
require "tmpdir"

RSpec.describe "Control Plane benchmark release" do
  def release_script
    Pathname.new(__dir__).join("../../.controlplane/release_script.sh").expand_path
  end

  def run_release(env = {})
    Dir.mktmpdir do |tmpdir|
      root = Pathname.new(tmpdir)
      calls = root.join("rails-calls.log")
      FileUtils.mkdir_p(root.join("bin"))
      root.join("bin/rails").write(<<~SH)
        #!/bin/sh
        echo "$*" >> "$RAILS_CALL_LOG"
        [ "${FAIL_RAILS_COMMAND:-}" != "$*" ]
      SH
      FileUtils.chmod("+x", root.join("bin/rails"))

      stdout, stderr, status = Open3.capture3(
        {
          "ALLOW_BENCHMARK_SEED" => nil,
          "BRANCH" => "gumroad-rorp",
          "CPLN_GVC" => nil,
          "DATABASE_HOST" => "mysql",
          "DATABASE_PORT" => "3306",
          "GUMROAD_RENDERING_SURFACE" => "rorp",
          "RAILS_CALL_LOG" => calls.to_s,
          "SKIP_CONTROL_PLANE_SERVICE_WAIT" => "true",
        }.merge(env),
        release_script.to_s,
        chdir: root.to_s
      )

      [
        status,
        stdout,
        stderr,
        calls.exist? ? calls.read.lines.map(&:chomp) : [],
      ]
    end
  end

  it "prepares the database without silently installing fixtures" do
    status, _stdout, stderr, calls = run_release

    expect(status).to be_success, stderr
    expect(calls).to eq(["db:prepare", "runner scripts/verify_control_plane_benchmark_storage.rb"])
    expect(release_script.read).not_to include("Mysql2", "db:schema:load", "db:migrate", "bundle exec", "db:seed")
    expect(release_script.read).not_to match(/minio/i)
  end

  it "stops before storage and fixtures when database preparation fails" do
    status, _stdout, stderr, calls = run_release("FAIL_RAILS_COMMAND" => "db:prepare")

    expect(status).not_to be_success, stderr
    expect(stderr).to include("Database preparation failed")
    expect(calls).to eq(["db:prepare"])
  end

  it "bootstraps taxonomies before deterministic fixtures and reindexing" do
    status, _stdout, stderr, calls = run_release("ALLOW_BENCHMARK_SEED" => "true")

    expect(status).to be_success, stderr
    expect(calls).to eq([
                          "db:prepare",
                          "runner scripts/verify_control_plane_benchmark_storage.rb",
                          "runner Taxonomy::Seeder.new.perform",
                          "runner scripts/seed_native_product_page.rb",
                          "runner scripts/seed_shakaperf_seller_profile.rb",
                          "runner scripts/seed_shakaperf_discover.rb",
                          "runner DevTools.delete_all_indices_and_reindex_all",
                        ])
  end

  it "rejects another app before database mutation" do
    status, _stdout, stderr, calls = run_release("BRANCH" => "gumroad-inertia")

    expect(status).not_to be_success
    expect(stderr).to include("expected gumroad-rorp")
    expect(calls).to be_empty
  end

  it "rejects another rendering surface before database mutation" do
    status, _stdout, stderr, calls = run_release("GUMROAD_RENDERING_SURFACE" => "inertia")

    expect(status).not_to be_success
    expect(stderr).to include("expected rorp")
    expect(calls).to be_empty
  end
end
