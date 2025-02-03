#!/bin/bash

# CSS
mkdir -p public/stylesheets
cp ./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css ./public/stylesheets/accessible-autocomplete.min.css

# JS
mkdir -p public/javascripts
cp ./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js ./public/javascripts/accessible-autocomplete.min.js
cp ./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js.map ./public/javascripts/accessible-autocomplete.min.js.map
