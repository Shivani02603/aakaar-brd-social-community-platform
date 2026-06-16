.PHONY: install dev build test docker-up docker-down clean

install:
	cd backend && npm install
	cd frontend && npm install

dev:
	./scripts/dev.sh

build:
	cd backend && npm run build
	cd frontend && npm run build

test:
	cd backend && npm test
	cd frontend && npm test

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

clean:
	rm -rf backend/node_modules frontend/node_modules
	rm -rf backend/dist frontend/dist
	docker-compose down -v
	docker system prune -f