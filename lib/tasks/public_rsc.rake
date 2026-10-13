# frozen_string_literal: true

namespace :public_rsc do
  desc "Build the public product client packs and private renderer bundles"
  task build: [:environment, "js:export", "react_on_rails:generate_packs"] do
    sh({ "SHAKAPACKER_ASSET_HOST" => Shakapacker.config.asset_host.to_s }, "npx rspack --config config/rspack/public_rsc.config.cjs")
  end
end

if Rake::Task.task_defined?("assets:precompile")
  Rake::Task["assets:precompile"].enhance(["public_rsc:build"])
end
