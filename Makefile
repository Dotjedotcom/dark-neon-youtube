.PHONY: install dev build preview format f ff lint l lf test docker/build docker/run

IMAGE ?= darkmode-todo

install:
	npm i

i: install

dev: i
	npm run dev

build:
	npm run build

preview: build
	npm run preview
