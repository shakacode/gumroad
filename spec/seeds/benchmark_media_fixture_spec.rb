# frozen_string_literal: true

require "digest/sha2"
require "spec_helper"

RSpec.describe "benchmark media fixtures" do
  fixture_path = Rails.root.join("public/native-product-page-fixture")
  expected = {
    "microsoft-365.webp" => [[1_000, 1_414], 127_254, "7d0743bc3379eebddcf08858f08af8303bfff68290c03825ed2a0e008ec0d4f8"],
    "microsoft-365-thumbnail.webp" => [[600, 600], 48_216, "3cc2cb097f64d1708cc1d7c4f549963b6d9037e044b217612f088531b6ddec48"],
    "powershell.webp" => [[1_005, 1_421], 72_914, "1a468293fa55307887d91ffdb79e60b0a896b72ab901192258f1c1b6a0334014"],
    "powershell-thumbnail.webp" => [[600, 600], 29_678, "86c77ec52356f1ca982cb45f7e58aa7c2aff4cc1664615b3b3f4ae7eb18baef6"],
    "purview.webp" => [[1_005, 1_421], 135_656, "1a8a9c8f523778e9b4417843a31bcbec64d9abb00be724fe199b84b1e2d89c8d"],
    "purview-thumbnail.webp" => [[600, 600], 55_828, "b334d6d9fec1c74b06cd3c6d1f7c765924f161581d58f072247e185329f662b5"],
    "power-platform.webp" => [[1_005, 1_421], 90_126, "03e17ccaca0d58803a9c8339c633c9cd59e92d347c831b80387f312bba7597d6"],
    "power-platform-thumbnail.webp" => [[600, 600], 38_762, "dd34f4790224f651de84b08d4e869afde690ae9c12270edb0539cfba6c70ab81"],
    "residential-guide-thumbnail.webp" => [[600, 600], 30_062, "f0c0e1d995090e31a40a72676e194e2de2b656bb9d0f55ab6c9f195bcbf0f37a"],
    "luis-furushio-profile.webp" => [[400, 400], 18_122, "b2f42b911f5d994e022dab455f2c893dd0478765d00981f86986546af22aaf92"],
    "residential-guide-preview-1.webp" => [[1_005, 770], 61_518, "f080166df7ef4cfafd00c95b6f99a642f805af212d8429bf9bd2316c2623f6c8"],
    "residential-guide-preview-2.webp" => [[1_005, 770], 103_408, "062c016176b326dfb97ddc159c0b7c8f2c8fdac7b23171cbe9722c35e3763591"],
    "residential-guide-preview-3.webp" => [[1_005, 770], 94_502, "9049959ceee560c4178f7921f65512832b307ccd53841d8b49ebe6971172dd37"],
    "residential-guide-preview-4.webp" => [[1_005, 770], 110_620, "230ce725294f51cc31c374e0b9c048f60475841fe08e9c9d18f5b3eb31161760"],
    "residential-guide-preview-5.webp" => [[1_005, 770], 68_260, "156fd9baa481b2931d716dbb58f12c615a90a3c452be093e3380d16a5217e145"],
    "residential-guide-detail-1.webp" => [[1_042, 492], 77_216, "2673b35a2169db9163173411bc83f2bacf93af64c661b1715a7374b8047a65fa"],
    "residential-guide-detail-2.webp" => [[1_042, 567], 72_460, "bd61594961be40206d242dbc247723beb223be897f3b57459b024a5043e0e325"],
    "residential-guide-detail-3.webp" => [[2_083, 930], 122_002, "1f9f22a078b601c614ad34e06cf89497e296309018867691a2e3944809018744"],
    "residential-guide-detail-4.webp" => [[4_167, 1_881], 249_018, "ab5db3328a7db97301e0db6b200593603b037848f1b3090110deda65f03c2102"],
    "residential-guide-detail-5.webp" => [[1_042, 708], 79_026, "fe946fa35071e3bae9b5d20cda3892d27c20490e1c39544fa475078fde92b190"],
    "residential-guide-detail-6.webp" => [[1_042, 483], 56_154, "9e97df415874e60ac14c3c8d603ab35c6f192ca4af2b46e7be3f878d99890d49"],
  }

  it "contains only the verified production-delivered WebP media" do
    fixture_files = Dir[fixture_path.join("*")].filter_map do |path|
      File.basename(path) unless File.basename(path) == "SOURCES.md"
    end
    expect(fixture_files).to match_array(expected.keys)

    expected.each do |filename, (dimensions, byte_size, sha256)|
      path = fixture_path.join(filename)
      image = MiniMagick::Image.open(path.to_s)
      expect(image.type).to eq("WEBP")
      expect(image.dimensions).to eq(dimensions)
      expect(path.size).to eq(byte_size)
      expect(Digest::SHA256.file(path).hexdigest).to eq(sha256)
    ensure
      image&.destroy!
    end
  end
end
