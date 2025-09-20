.PHONY: install dev build preview format f ff lint l lf test docker/build docker/run

IMAGE ?= dark-neon-youtube
TAG ?= latest
DOCKER ?= docker
HOST_PORT ?= 8080
CONTAINER_NAME ?= $(IMAGE)-app

install:
	npm i

i: install

dev: i
	npm run dev

build:
	npm run build

preview: build
	npm run preview

docker/build:
	$(DOCKER) build -t $(IMAGE):$(TAG) .

docker/run: docker/build
	$(DOCKER) run --rm -p $(HOST_PORT):8080 --name $(CONTAINER_NAME) $(IMAGE):$(TAG)

db: docker/build

dr: docker/run