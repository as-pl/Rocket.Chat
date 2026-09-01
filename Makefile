packages-build:
	yarn turbo build --no-cache

app-build:
	cd apps/meteor && METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory ../../custom-build

docker-build:
	docker build -t arturkmera/custom-rc:8.1.11 -f apps/meteor/.docker/Dockerfile.debian ./custom-build

docker-push:
	docker push arturkmera/custom-rc:8.1.11

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
		arturkmera/custom-rc

test-local-build:
	yarn install
	$(MAKE) packages-build
	$(MAKE) app-build
	$(MAKE) docker-build
	docker run -it --rm -p 3000:3000 arturkmera/custom-rc

# w razie czego  cd packages/livechat && yarn build
.PHONY: start

start:
	. "$$HOME/.nvm/nvm.sh" && nvm use 22.22.3 && ( \
		ROOT_URL='http://localhost:3100' OVERWRITE_SETTING_Site_Url='http://localhost:3100' OVERWRITE_SETTING_API_Enable_CORS='true' OVERWRITE_SETTING_API_CORS_Origin='http://localhost:8180' OVERWRITE_SETTING_API_Enable_Rate_Limiter_Dev='false' yarn dsv -- -- --port 3100 & \
		( cd packages/livechat && LIVECHAT_EMBEDDED='false' LIVECHAT_PORT=8180 ROCKET_CHAT_URL='http://localhost:3100' yarn start ) & \
		( cd packages/livechat && yarn dlx http-server -p 8181 ) \
	)
