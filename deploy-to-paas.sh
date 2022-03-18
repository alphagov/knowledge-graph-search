#!/usr/bin/env bash

if [ "${GA_ID}" != "" ]; then
    echo "GA_ID is set to ${GA_ID}"
else
    echo "Enter a GA tracking ID"
    read -r GA_ID
    echo "You entered ${GA_ID}"
    echo "Is that correct? (y/n)"
    read -r CONFIRM

    if [ "${CONFIRM}" != "y" ]; then
        echo "Aborting"
        exit 1
    fi
fi


echo "Inserting GA snippet"

SNIPPET="<script async src=\"https:\/\/www.googletagmanager.com\/gtag\/js?id=${GA_ID}\"><\/script> \
<script> \
  window.dataLayer = window.dataLayer || []; \
  function gtag(){dataLayer.push(arguments);} \
  gtag('js', new Date()); \
  gtag('config', '${GA_ID}'); \
<\/script>"

echo "injecting snippet"

PLACEHOLDER='<!-- INSERT GA SNIPPET -->'

sed -i".bak" -e "s/${PLACEHOLDER}/${SNIPPET}/" index.html

echo "Pushing app"

cf push knowledge-graph-search
mv index.html.bak index.html

echo "Done"
