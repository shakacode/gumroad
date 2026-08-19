# syntax=docker/dockerfile:1

ARG RUBY_VERSION=3.4.3
ARG NODE_VERSION=22.22.0
ARG NON_ROOT_USER=rails
ARG UID=1000
ARG GID=1000
ARG BUNDLE_PATH=/home/${NON_ROOT_USER}/bundle
ARG APP_PATH=/home/${NON_ROOT_USER}/app

FROM node:${NODE_VERSION}-bullseye-slim AS node
FROM ruby:${RUBY_VERSION}-slim-bullseye

ARG NON_ROOT_USER
ARG UID
ARG GID
ARG BUNDLE_PATH
ARG APP_PATH

ENV LANG=C.UTF-8 \
    BUNDLE_PATH=${BUNDLE_PATH} \
    PATH=${BUNDLE_PATH}/bin:/usr/local/bin:${PATH}

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
      memcached \
      pkg-config \
      procps \
      zlib1g-dev && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node /usr/local/include/node /usr/local/include/node

RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && \
    ln -sf ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack

RUN getent group "${GID}" | cut -d: -f1 | xargs -r groupdel || true
RUN groupadd --gid "${GID}" "${NON_ROOT_USER}" && \
    useradd --uid "${UID}" --gid "${GID}" --create-home --shell /bin/sh "${NON_ROOT_USER}" && \
    mkdir -p "${APP_PATH}" "${BUNDLE_PATH}" && \
    chown -R "${NON_ROOT_USER}:${NON_ROOT_USER}" "/home/${NON_ROOT_USER}"

WORKDIR ${APP_PATH}
USER ${NON_ROOT_USER}

COPY --chown=${NON_ROOT_USER}:${NON_ROOT_USER} Gemfile Gemfile.lock .ruby-version ./
RUN gem install bundler:$(awk '/BUNDLED WITH/{getline; print}' Gemfile.lock | tr -d ' ') && \
    bundle config set without 'test deployer' && \
    GRPC_RUBY_BUILD_PROCS=2 bundle install --jobs=3 --retry=3

COPY --chown=${NON_ROOT_USER}:${NON_ROOT_USER} package.json package-lock.json ./
COPY --chown=${NON_ROOT_USER}:${NON_ROOT_USER} patches ./patches
RUN npm ci --legacy-peer-deps

COPY --chown=${NON_ROOT_USER}:${NON_ROOT_USER} . ./

ENV RAILS_ENV=benchmark \
    RACK_ENV=benchmark \
    NODE_ENV=production \
    VITE_RUBY_MODE=production \
    VITE_RUBY_ASSET_HOST= \
    RAILS_LOG_TO_STDOUT=true \
    RAILS_SERVE_STATIC_FILES=true \
    VITE_RUBY_AUTO_BUILD=false \
    SECRET_KEY_BASE=shakaperf-placeholder-secret-key-base \
    DEVISE_SECRET_KEY=shakaperf-placeholder-devise-secret-key \
    OBFUSCATE_IDS_CIPHER_KEY=shakaperf \
    OBFUSCATE_IDS_NUMERIC_CIPHER_KEY=1234 \
    RENDERER_PASSWORD=shakaperf-renderer-password \
    REACT_RENDERER_URL=http://127.0.0.1:3800 \
    DATABASE_HOST=127.0.0.1 \
    DATABASE_PORT=3306 \
    DATABASE_NAME=gumroad_development \
    DATABASE_USERNAME=root \
    DATABASE_PASSWORD=password \
    MONGO_DATABASE_URL=127.0.0.1:27017 \
    MONGO_SECONDARY_DATABASE_URL=127.0.0.1:27017 \
    MONGO_DATABASE_NAME=gumroad_log_development \
    MONGO_DATABASE_USERNAME=username \
    MONGO_DATABASE_PASSWORD=password \
    REDIS_HOST=127.0.0.1:6379/0 \
    SIDEKIQ_REDIS_HOST=127.0.0.1:6379/1 \
    RPUSH_REDIS_HOST=127.0.0.1:6379/2 \
    RACK_ATTACK_REDIS_HOST=127.0.0.1:6379/3 \
    MEMCACHE_SERVERS=127.0.0.1:11211 \
    ELASTICSEARCH_HOST=http://127.0.0.1:9200 \
    CUSTOM_DOMAIN=localhost \
    BRANCH_DEPLOYMENT=false

RUN export NODE_OPTIONS="--max-old-space-size=4096" && \
    export STRONGBOX_GENERAL="$(ruby -ropenssl -e 'print OpenSSL::PKey::RSA.generate(2048).to_pem')" && \
    export STRONGBOX_GENERAL_PASSWORD="" && \
    npm run setup && \
    if node -e 'process.exit(require("./package.json").scripts["build:product-rsc"] ? 0 : 1)'; then npm run build:product-rsc; fi && \
    bundle exec rails assets:precompile

RUN mkdir -p log tmp/pids tmp/cache storage public/native-product-page-fixture

EXPOSE 3000

# ShakaPerf owns process startup through Docker Compose and Overmind.
