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




test-local-build:

	$(MAKE) packages-build
	$(MAKE) app-build
	$(MAKE) docker-build
	docker run -it --rm -p 3000:3000 arturkmera/custom-rc
	