#!/bin/bash

# CSS
mkdir -p public/stylesheets
cp ./node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.css public/stylesheets/govuk-frontend.min.css

# Images
mkdir -p public/assets
cp -r ./node_modules/govuk-frontend/dist/govuk/assets/images public/assets/images

# Fonts
mkdir -p public/assets
cp -r ./node_modules/govuk-frontend/dist/govuk/assets/fonts public/assets/

# Manifest
mkdir -p public/assets
cp ./node_modules/govuk-frontend/dist/govuk/assets/manifest.json public/assets

# JS
mkdir -p ./public/javascripts
cp ./node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.js ./public/javascripts/govuk-frontend.min.js
cp ./node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.js.map ./public/javascripts/govuk-frontend.min.js.map
