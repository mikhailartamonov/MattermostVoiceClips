# Mattermost Voice Clips Plugin Makefile

PLUGIN_ID := com.mattermost.voice-clips
PLUGIN_VERSION := 0.1.0

# Go parameters
GOCMD := go
GOBUILD := $(GOCMD) build
GOCLEAN := $(GOCMD) clean
GOTEST := $(GOCMD) test
GOGET := $(GOCMD) get
GOMOD := $(GOCMD) mod

# Directories
DIST_DIR := dist
SERVER_DIR := server
WEBAPP_DIR := webapp
ASSETS_DIR := assets

# Build targets
SERVER_DIST_DIR := $(SERVER_DIR)/dist
WEBAPP_DIST_DIR := $(WEBAPP_DIR)/dist
BUNDLE_NAME := $(PLUGIN_ID)-$(PLUGIN_VERSION).tar.gz

# Architectures to build
PLATFORMS := linux-amd64 linux-arm64 darwin-amd64 darwin-arm64 windows-amd64

## Default target
.PHONY: all
all: dist

## Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning..."
	rm -rf $(DIST_DIR)
	rm -rf $(SERVER_DIST_DIR)
	rm -rf $(WEBAPP_DIST_DIR)
	cd $(SERVER_DIR) && $(GOCLEAN)
	cd $(WEBAPP_DIR) && rm -rf node_modules dist
	@echo "Clean complete"

## Build server binaries for all platforms
.PHONY: server
server:
	@echo "Building server..."
	@mkdir -p $(SERVER_DIST_DIR)

	# Linux AMD64
	cd $(SERVER_DIR) && GOOS=linux GOARCH=amd64 $(GOBUILD) -o dist/plugin-linux-amd64

	# Linux ARM64
	cd $(SERVER_DIR) && GOOS=linux GOARCH=arm64 $(GOBUILD) -o dist/plugin-linux-arm64

	# macOS AMD64
	cd $(SERVER_DIR) && GOOS=darwin GOARCH=amd64 $(GOBUILD) -o dist/plugin-darwin-amd64

	# macOS ARM64 (Apple Silicon)
	cd $(SERVER_DIR) && GOOS=darwin GOARCH=arm64 $(GOBUILD) -o dist/plugin-darwin-arm64

	# Windows AMD64
	cd $(SERVER_DIR) && GOOS=windows GOARCH=amd64 $(GOBUILD) -o dist/plugin-windows-amd64.exe

	@echo "Server build complete"

## Build webapp
.PHONY: webapp
webapp:
	@echo "Building webapp..."
	cd $(WEBAPP_DIR) && npm install
	cd $(WEBAPP_DIR) && npm run build
	@echo "Webapp build complete"

## Download Go dependencies
.PHONY: go-deps
go-deps:
	@echo "Downloading Go dependencies..."
	cd $(SERVER_DIR) && $(GOMOD) download
	cd $(SERVER_DIR) && $(GOMOD) tidy
	@echo "Go dependencies downloaded"

## Install Node dependencies
.PHONY: node-deps
node-deps:
	@echo "Installing Node dependencies..."
	cd $(WEBAPP_DIR) && npm install
	@echo "Node dependencies installed"

## Install all dependencies
.PHONY: deps
deps: go-deps node-deps

## Create distribution bundle
.PHONY: dist
dist: clean deps server webapp
	@echo "Creating distribution bundle..."
	@mkdir -p $(DIST_DIR)/$(PLUGIN_ID)

	# Copy plugin manifest
	cp plugin.json $(DIST_DIR)/$(PLUGIN_ID)/

	# Copy server binaries
	@mkdir -p $(DIST_DIR)/$(PLUGIN_ID)/server/dist
	cp -r $(SERVER_DIST_DIR)/* $(DIST_DIR)/$(PLUGIN_ID)/server/dist/

	# Copy webapp bundle
	@mkdir -p $(DIST_DIR)/$(PLUGIN_ID)/webapp/dist
	cp $(WEBAPP_DIST_DIR)/main.js $(DIST_DIR)/$(PLUGIN_ID)/webapp/dist/

	# Copy assets if they exist
	@if [ -d "$(ASSETS_DIR)" ]; then \
		mkdir -p $(DIST_DIR)/$(PLUGIN_ID)/assets; \
		cp -r $(ASSETS_DIR)/* $(DIST_DIR)/$(PLUGIN_ID)/assets/; \
	fi

	# Create tarball
	cd $(DIST_DIR) && tar -czf $(BUNDLE_NAME) $(PLUGIN_ID)

	@echo "Distribution bundle created: $(DIST_DIR)/$(BUNDLE_NAME)"

## Deploy plugin to local Mattermost instance
.PHONY: deploy
deploy: dist
	@echo "Deploying plugin..."
	@if [ -z "$(MM_SERVICESETTINGS_SITEURL)" ]; then \
		echo "Error: MM_SERVICESETTINGS_SITEURL is not set"; \
		exit 1; \
	fi
	@if [ -z "$(MM_ADMIN_TOKEN)" ]; then \
		echo "Error: MM_ADMIN_TOKEN is not set"; \
		exit 1; \
	fi

	curl -X POST $(MM_SERVICESETTINGS_SITEURL)/api/v4/plugins \
		-H "Authorization: Bearer $(MM_ADMIN_TOKEN)" \
		-F "plugin=@$(DIST_DIR)/$(BUNDLE_NAME)" \
		-F "force=true"

	@echo "Plugin deployed"

## Run tests
.PHONY: test
test:
	@echo "Running tests..."
	cd $(SERVER_DIR) && $(GOTEST) -v ./...
	cd $(WEBAPP_DIR) && npm test || true
	@echo "Tests complete"

## Watch and rebuild webapp on changes
.PHONY: watch
watch:
	@echo "Watching webapp for changes..."
	cd $(WEBAPP_DIR) && npm run dev

## Display help
.PHONY: help
help:
	@echo "Mattermost Voice Clips Plugin - Available targets:"
	@echo ""
	@echo "  make all        - Build everything (default)"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make deps       - Install all dependencies"
	@echo "  make server     - Build server for all platforms"
	@echo "  make webapp     - Build webapp"
	@echo "  make dist       - Create distribution bundle"
	@echo "  make deploy     - Deploy to local Mattermost (requires MM_SERVICESETTINGS_SITEURL and MM_ADMIN_TOKEN)"
	@echo "  make test       - Run tests"
	@echo "  make watch      - Watch webapp and rebuild on changes"
	@echo "  make help       - Show this help"
	@echo ""
