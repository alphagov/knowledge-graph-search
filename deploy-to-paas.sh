#!/usr/bin/env bash

if [ "${GTM_ID}" != "" ]; then
    echo "GTM_ID is set to ${GTM_ID}"
else
    echo "Enter a GTM tracking ID"
    read -r GTM_ID
    echo "You entered ${GTM_ID}"
    echo "Is that correct? (y/n)"
    read -r CONFIRM

    if [ "${CONFIRM}" != "y" ]; then
        echo "Aborting"
        exit 1
    fi
fi


echo "Inserting GTM snippet"

GTM_HEAD_SNIPPET="<\!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l\!='dataLayer'?'\&l='+l:'';j.async=true;j.src='https:\/\/www.googletagmanager.com\/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');<\/script><\!-- End Google Tag Manager -->"


GTM_BODY_SNIPPET="<\!-- Google Tag Manager (noscript) --><noscript><iframe src=\"https:\/\/www.googletagmanager.com\/ns.html?id=${GTM_ID}\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"><\/iframe><\/noscript><\!-- End Google Tag Manager (noscript) -->"

GTM_HEAD_PLACEHOLDER='<\!-- INSERT GTM HEAD SNIPPET -->'
GTM_BODY_PLACEHOLDER='<\!-- INSERT GTM BODY SNIPPET -->'

sed -i".bak" -e "s/${GTM_HEAD_PLACEHOLDER}/${GTM_HEAD_SNIPPET}/" -e"s/${GTM_BODY_PLACEHOLDER}/${GTM_BODY_SNIPPET}/" index.html

echo "Pushing app"

cf push knowledge-graph-search
mv index.html.bak index.html

echo "Done"
