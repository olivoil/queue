build: node_modules components index.js
	@component build --dev

node_modules: package.json
	@npm install --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components

test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--slow 1s \
		--timeout 5s

.PHONY: clean test
