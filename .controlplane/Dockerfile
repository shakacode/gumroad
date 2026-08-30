ARG RUBY_VERSION=3.4.3
ARG NODE_VERSION=22.22.2

FROM docker.io/library/node:${NODE_VERSION}-bookworm-slim AS node
FROM docker.io/library/ruby:${RUBY_VERSION}-slim-bookworm

ARG GIT_COMMIT

ENV APP_DIR=/app \
    BUNDLE_PATH=/usr/local/bundle \
    LANG=C.UTF-8 \
    RAILS_ENV=benchmark \
    RACK_ENV=benchmark \
    NODE_ENV=production \
    RAILS_LOG_TO_STDOUT=true \
    RAILS_SERVE_STATIC_FILES=true \
    VITE_RUBY_MODE=production \
    VITE_RUBY_AUTO_BUILD=false \
    GIT_COMMIT=${GIT_COMMIT}

WORKDIR ${APP_DIR}

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      ca-certificates \
      curl \
      default-libmysqlclient-dev \
      ffmpeg \
      fonts-dejavu \
      git \
      imagemagick \
      libcurl4-openssl-dev \
      liblzma-dev \
      libssl-dev \
      libvips-dev \
      libxml2-dev \
      libyaml-dev \
      pkg-config \
      zlib1g-dev && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node /usr/local/include/node /usr/local/include/node

RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && \
    ln -sf ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack

COPY Gemfile Gemfile.lock .ruby-version ./
RUN gem install bundler:$(awk '/BUNDLED WITH/{getline; print}' Gemfile.lock | tr -d " ") && \
    bundle config set without 'development test' && \
    bundle install --jobs=3 --retry=3

COPY package.json package-lock.json .npmrc ./
COPY patches ./patches
RUN npm ci --include=dev

COPY . ./

# These values exist only in this layer's process so runtime configuration can
# never inherit build placeholders.
RUN export NODE_OPTIONS=--max-old-space-size=4096 \
    VITE_RUBY_ASSET_HOST='' \
    RENDERER_PASSWORD=build-placeholder-renderer-password \
    SECRET_KEY_BASE=build-placeholder-secret-key-base \
    DEVISE_SECRET_KEY=build-placeholder-devise-secret-key \
    OBFUSCATE_IDS_CIPHER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
    OBFUSCATE_IDS_NUMERIC_CIPHER_KEY=123456789 \
    STRONGBOX_GENERAL="$(ruby -ropenssl -e 'print OpenSSL::PKey::RSA.generate(2048).to_pem')" \
    STRONGBOX_GENERAL_PASSWORD='' \
    DATABASE_HOST=127.0.0.1 \
    DATABASE_PORT=3306 \
    DATABASE_NAME=gumroad_benchmark \
    DATABASE_USERNAME=gumroad \
    DATABASE_PASSWORD=build-placeholder \
    MONGO_DATABASE_URL=127.0.0.1:27017 \
    MONGO_SECONDARY_DATABASE_URL=127.0.0.1:27017 \
    MONGO_DATABASE_NAME=gumroad_log_benchmark \
    MONGO_DATABASE_USERNAME=gumroad \
    MONGO_DATABASE_PASSWORD=build-placeholder \
    MONGO_AUTH_SOURCE=admin \
    REDIS_HOST=127.0.0.1:6379/0 \
    SIDEKIQ_REDIS_HOST=127.0.0.1:6379/1 \
    RPUSH_REDIS_HOST=127.0.0.1:6379/2 \
    RACK_ATTACK_REDIS_HOST=127.0.0.1:6379/3 \
    MEMCACHE_SERVERS=127.0.0.1:11211 \
    ELASTICSEARCH_HOST=http://127.0.0.1:9200 \
    AWS_ACCESS_KEY_ID=build-placeholder \
    AWS_SECRET_ACCESS_KEY=build-placeholder \
    AWS_DEFAULT_REGION=us-east-1 \
    CUSTOM_DOMAIN=gumroad-rorp.reactonrails.com \
    BENCHMARK_PROTOCOL=https \
    BENCHMARK_STORAGE_SERVICE=control_plane_benchmark \
    CONTROL_PLANE_BENCHMARK=true \
    BENCHMARK_STORAGE_S3_ENDPOINT=http://127.0.0.1:9000 \
    BENCHMARK_STORAGE_S3_ACCESS_KEY_ID=build-placeholder \
    BENCHMARK_STORAGE_S3_SECRET_ACCESS_KEY=build-placeholder \
    BENCHMARK_STORAGE_S3_REGION=auto \
    BENCHMARK_STORAGE_S3_BUCKET=gumroad-rorp-public-storage \
    BENCHMARK_STORAGE_PUBLIC_HOST=public-files.gumroad-rorp.reactonrails.com \
    BENCHMARK_CACHE_NAMESPACE=gumroad-rorp \
    SESSION_COOKIE_DOMAIN='' \
    BRANCH=gumroad-rorp \
    REVISION=gumroad-rorp \
    GUMROAD_RENDERING_SURFACE=rorp \
    SKIP_BRANCH_APP_ES_INDEX_SETUP=true && \
    npm run setup && \
    npm run build:public-rsc && \
    npx vite build && \
    bundle exec rails assets:precompile

COPY .controlplane/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh /app/.controlplane/release_script.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
