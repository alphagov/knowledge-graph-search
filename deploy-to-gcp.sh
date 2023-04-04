#!/usr/bin/env bash

echo "This script is for deploying the production version of GovGraphSearch. It
sets the GA/GTM ids in the HTML source and deploys to the production GCP
project."

echo "Do not use this script to deploy to the dev or staging servers. Instead
use the gcloud command line directly."

echo "Press return to continue or control-c to stop."
read -r CONFIRM

if [ "${GTM_ID}" != "" ]; then
    echo "GTM_ID is set to ${GTM_ID}"
else
    echo "Enter a GTM tracking ID."
    echo "If you're unsure, ask the GA team or check the source HTML of the current live version."
    read -r GTM_ID
    echo "You entered ${GTM_ID}"
    echo "Is that correct? (y/n)"
    read -r CONFIRM

    if [ "${CONFIRM}" != "y" ]; then
        echo "Aborting"
        exit 1
    fi
fi

if [ "${GTM_AUTH}" != "" ]; then
    echo "GTM_AUTH is set to ${GTM_AUTH}"
else
    echo "Enter a GTM tracking ID"
    echi "If you're unsure, ask the GA team or check the source HTML of the current live version."
    read -r GTM_AUTH
    echo "You entered ${GTM_AUTH}"
    echo "Is that correct? (y/n)"
    read -r CONFIRM

    if [ "${CONFIRM}" != "y" ]; then
        echo "Aborting"
        exit 1
    fi
fi




echo "Inserting GTM snippet"

GTM_HEAD_SNIPPET="<\!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l\!='dataLayer'?'\&l='+l:'';j.async=true;j.src='https:\/\/www.googletagmanager.com\/gtm.js?id='+i+dl+ '\&gtm_auth=${GTM_AUTH}\&gtm_preview=env-59\&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');<\!-- End Google Tag Manager --><\/script>"

GTM_BODY_SNIPPET="<\!-- Google Tag Manager (noscript) --><noscript><iframe src=\"https:\/\/www.googletagmanager.com\/ns.html\?id=${GTM_ID}\&gtm_auth=${GTM_AUTH}\&gtm_preview=env-59\&gtm_cookies_win=x\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"><\/iframe><\/noscript><\!-- End Google Tag Manager (noscript) -->"


GTM_HEAD_PLACEHOLDER='<\!-- INSERT GTM HEAD SNIPPET -->'
GTM_BODY_PLACEHOLDER='<\!-- INSERT GTM BODY SNIPPET -->'

echo "Inserting snippets"

sed -i".bak" -e "s/${GTM_HEAD_PLACEHOLDER}/${GTM_HEAD_SNIPPET}/" -e"s/${GTM_BODY_PLACEHOLDER}/${GTM_BODY_SNIPPET}/" public/index.html


echo "Pushing app"

gcloud run deploy govuk-knowledge-graph-search --project govuk-knowledge-graph --source .
mv public/index.html.bak public/index.html

echo "Done"
