# frozen_string_literal: true

require "fileutils"
require "open3"
require "pathname"
require "tmpdir"

RSpec.describe "Control Plane backing-service secret bootstrap" do
  def root
    Pathname.new(__dir__).join("../..").expand_path
  end

  def run_bootstrap(r2_exists: true, extra_env: {})
    Dir.mktmpdir do |tmpdir|
      bin = Pathname.new(tmpdir)
      create_log = bin.join("r2-create.log")
      bin.join("cpln").write(<<~SH)
        #!/bin/sh
        case "$*" in
          "org get "*) exit 0 ;;
          "secret get gumroad-rorp-r2 "*) [ "$R2_EXISTS" = "true" ] ;;
          "secret get gumroad-rorp-mysql "*|"secret get gumroad-rorp-mongo "*) exit 0 ;;
          "secret reveal gumroad-rorp-mysql "*)
            printf '%s\n' '{"data":{"database":"set","username":"set","password":"set","root_password":"set"}}'
            ;;
          "secret reveal gumroad-rorp-mongo "*)
            printf '%s\n' '{"data":{"username":"set","password":"set"}}'
            ;;
          "secret reveal gumroad-rorp-r2 "*)
            printf '%s\n' '{"data":{"endpoint":"https://account.r2.cloudflarestorage.com","access_key_id":"set","secret_access_key":"set","bucket":"shaka-perf-demo-storage"}}'
            ;;
          "secret create-dictionary "*"--name gumroad-rorp-r2 "*)
            printf '%s\n' "$*" > "$R2_CREATE_LOG"
            ;;
          *) echo "unexpected cpln call: $*" >&2; exit 42 ;;
        esac
      SH
      bin.join("openssl").write(<<~SH)
        #!/bin/sh
        echo "unexpected openssl call: $*" >&2
        exit 43
      SH
      FileUtils.chmod("+x", [bin.join("cpln"), bin.join("openssl")])

      result = Open3.capture3(
        {
          "PATH" => "#{bin}:#{ENV.fetch("PATH")}",
          "R2_CREATE_LOG" => create_log.to_s,
          "R2_EXISTS" => r2_exists.to_s,
        }.merge(extra_env),
        root.join("bin/prepare-control-plane-benchmark-secrets").to_s,
        "--org",
        "shakacode-open-source-examples-staging",
        chdir: root.to_s
      )
      [*result, create_log.exist? ? create_log.read : ""]
    end
  end

  it "leaves application secrets, policies, and identity bindings to cpflow" do
    _stdout, stderr, status = run_bootstrap

    expect(status).to be_success, stderr
    expect(stderr).to eq("")
  end

  it "imports provided R2 credentials into the fixed private bucket without echoing them" do
    stdout, stderr, status, create_call = run_bootstrap(
      r2_exists: false,
      extra_env: {
        "S3_ENDPOINT" => "https://account.r2.cloudflarestorage.com",
        "AWS_ACCESS_KEY_ID" => "opaque-access-key",
        "AWS_SECRET_ACCESS_KEY" => "opaque-secret-key",
      },
    )

    expect(status).to be_success, stderr
    expect(stdout).not_to include("opaque-access-key", "opaque-secret-key")
    expect(create_call).to include(
      "--name gumroad-rorp-r2",
      "--entry endpoint=https://account.r2.cloudflarestorage.com",
      "--entry access_key_id=opaque-access-key",
      "--entry secret_access_key=opaque-secret-key",
      "--entry bucket=shaka-perf-demo-storage",
    )
  end
end
