packages-build:
	yarn turbo build --no-cache


app-build:
	cd apps/meteor && METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory ../../custom-build



docker-build:
	docker build -t arturkmera/custom-rc -f apps/meteor/.docker/Dockerfile.debian ./custom-build



docker-push:
	docker push arturkmera/custom-rc


prepare:
	yarn install


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



# TESTING MOCK BUILD
test-local-build-first-run:
	yarn install
	docker network create rc-test || true
	docker rm -f mongo || true
	docker run -d --name mongo --network rc-test mongo:7 --replSet rs0 --oplogSize 128
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
