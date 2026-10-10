# frozen_string_literal: true

require "crass"
require "addressable/uri"

module ApplicationHelper
  INLINE_STYLESHEET_CACHE = ActiveSupport::Cache::MemoryStore.new(size: 1.megabyte)

  def vite_entrypoint_stylesheet_tag(name, inline: false, **options)
    entry = ViteRuby.instance.manifest.resolve_entries(name, type: :typescript)
    options[:extname] = false
    stylesheets = entry.fetch(:stylesheets, [])
    return vite_stylesheet_tag("entrypoints/#{name}.scss", **options) if stylesheets.empty?
    if inline
      contents = stylesheets.map { inline_vite_stylesheet_content(_1) }
      if contents.all?
        return safe_join(contents.map { tag.style(_1.html_safe, nonce: content_security_policy_nonce) })
      end
    end
    stylesheet_link_tag(*stylesheets, **options)
  end

  def s3_bucket_url
    "#{AWS_S3_ENDPOINT}/#{S3_BUCKET}"
  end

  def default_footer_content
    safe_join(
      [
        "Powered by",
        tag.span("Gumroad", class: "inline-block aspect-115/22 h-[1lh] shrink-0 bg-current mask-(--logo) mask-contain mask-center mask-no-repeat")
      ],
      " "
    )
  end

  def current_user_props(current_user, impersonated_user)
    {
      name: current_user.display_name,
      avatar_url: current_user.avatar_url,
      impersonated_user: impersonated_user.present? ? {
        name: impersonated_user.display_name,
        avatar_url: impersonated_user.avatar_url
      } : nil
    }
  end

  def number_to_si(number)
    number_to_human(
      number,
      units: { unit: "", thousand: "K", million: "M", billion: "B", trillion: "T" },
      precision: 1,
      significant: false,
      round_mode: :truncate,
      format: "%n%u"
    )
  end

  private
    def inline_vite_stylesheet_content(stylesheet)
      file = Rails.public_path.join(stylesheet.delete_prefix("/")).cleanpath
      return unless file.to_s.start_with?("#{Rails.public_path}/")

      source = URI.join(request.base_url, stylesheet_path(stylesheet, extname: false)).to_s
      INLINE_STYLESHEET_CACHE.fetch([Rails.env, file.to_s, source], expires_in: 1.hour) do
        previous = nil
        # Tokenizing keeps URL-looking strings and comments unchanged, including nested CSS.
        Crass::Tokenizer.tokenize(File.read(file), preserve_comments: true).map do |token|
          url = token[:node] == :url || (token[:node] == :string && previous &&
            ((previous[:node] == :function && previous[:value].casecmp?("url")) ||
             (previous[:node] == :at_keyword && previous[:value].casecmp?("import"))))
          previous = token unless [:whitespace, :comment].include?(token[:node])
          value = token[:value]
          if url && value.present? && !value.match?(%r{\A(?:[a-z][a-z\d+.-]*:|//|#)}i)
            absolute = JSON.generate(Addressable::URI.join(source, value).normalize.to_s)
            token[:node] == :url ? "url(#{absolute})" : absolute
          else
            token[:raw]
          end
        end.join.gsub(%r{</style}i) { |match| match.sub("/", '\\/') }
      end
    rescue Errno::ENOENT, URI::Error, Addressable::URI::InvalidURIError
      nil
    end
end
