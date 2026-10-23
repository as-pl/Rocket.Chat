# AS-PL customization: use the project's Deno version when publishing our custom image so Jitsi can load the bundled dependencies.
DENO_VERSION := $(shell awk '$$1 == "deno" { print $$2 }' .tool-versions)

# AS-PL customization: local builds retain immutable tags; the monorepo workflow publishes latest after checks.
.DEFAULT_GOAL := packages-build
.PHONY: guard-candidate docker-build docker-push
IMAGE_REPOSITORY ?= ghcr.io/as-pl/as-pl-monorepo/rocketchat
# AS-PL customization: expose the upstream base version without changing the application's version for fork releases.
UPSTREAM_VERSION := $(shell node -p 'require("./package.json").version')
IMAGE_TAG ?= $(UPSTREAM_VERSION)-aspl-local-$(shell git rev-parse --short=12 HEAD)

guard-candidate:
	@test "$(IMAGE_TAG)" != latest || (echo "latest is published by the monorepo workflow" >&2; exit 1)

packages-build:
	yarn turbo build --no-cache

app-build:
	cd apps/meteor && METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory ../../custom-build

docker-build: guard-candidate
	docker build --build-arg DENO_VERSION=$(DENO_VERSION) -t "$(IMAGE_REPOSITORY):$(IMAGE_TAG)" -f apps/meteor/.docker/Dockerfile.debian ./custom-build

docker-push: guard-candidate
	docker push "$(IMAGE_REPOSITORY):$(IMAGE_TAG)"

prepare:
	yarn install

# clean test meteor db
clean-meteor-db:
	rm -rf apps/meteor/.meteor/local/db

all-build:
	$(MAKE) prepare
	$(MAKE) packages-build
	$(MAKE) app-build
	$(MAKE) docker-build

rebuild-publish:
	$(MAKE) packages-build
	$(MAKE) app-build
	$(MAKE) docker-build
	$(MAKE) docker-push

# TESTING MOCK BUILD - docker level build test
test-local-build-first-run:
	yarn install
	docker network create rc-test || true
	docker rm -f mongo || true
	docker run -d --name mongo --network rc-test mongo:6 --replSet rs0 --oplogSize 128
	sleep 5
	docker exec mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"mongo:27017"}]})' || true
	$(MAKE) packages-build
	$(MAKE) app-build
	$(MAKE) docker-build
	docker run -it --rm \
		--network rc-test \
		-p 3000:3000 \
		-e ROOT_URL="http://localhost:3000" \
		-e MONGO_URL="mongodb://mongo:27017/rocketchat?replicaSet=rs0" \
		-e MONGO_OPLOG_URL="mongodb://mongo:27017/local?replicaSet=rs0" \
		$(IMAGE_REPOSITORY):$(IMAGE_TAG)

test-local-build:
	yarn install
	$(MAKE) packages-build
	$(MAKE) app-build
	$(MAKE) docker-build
	docker run -it --rm -p 3000:3000 $(IMAGE_REPOSITORY):$(IMAGE_TAG)

# w razie czego  cd packages/livechat && yarn build
.PHONY: start

start:
	. "$$HOME/.nvm/nvm.sh" && nvm use 22.22.3 && ( \
		ROOT_URL='http://localhost:3100' OVERWRITE_SETTING_Site_Url='http://localhost:3100' OVERWRITE_SETTING_API_Enable_CORS='true' OVERWRITE_SETTING_API_CORS_Origin='http://localhost:8180' OVERWRITE_SETTING_API_Enable_Rate_Limiter_Dev='false' yarn dsv -- -- --port 3100 & \
		( cd packages/livechat && LIVECHAT_EMBEDDED='false' LIVECHAT_PORT=8180 ROCKET_CHAT_URL='http://localhost:3100' yarn start ) & \
		( cd packages/livechat && yarn dlx http-server -p 8181 ) \
	)
