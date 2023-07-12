#!/usr/bin/env bash

echo "This script is for deploying the GovSearch app to the production, staging or dev environments."

echo "Press return to continue or control-c to stop."
read -r CONFIRM

if [ "${PROJECT_ID}" != "" ]; then
    echo "PROJECT_ID is set to ${PROJECT_ID}"
else
    echo "Choose an environment"
    while true; do
        options=("production" "staging" "dev")
        select opt in "${options[@]}"
        do
            case $opt in
                "production")
                    PROJECT_ID="govuk-knowledge-graph"
                    break 2
                    ;;
                "staging")
                    PROJECT_ID="govuk-knowledge-graph-${opt}"
                    break 2
                    ;;
                "dev")
                    PROJECT_ID="govuk-knowledge-graph-${opt}"
                    break 2
                    ;;
                *) echo "invalid option: $REPLY"; break 1;
            esac
        done
    done
    echo "You entered: ${opt}"
    echo "Is that correct? (y/n)"
    read -r CONFIRM

    if [ "${CONFIRM}" != "y" ]; then
        echo "Aborting"
        exit 1
    fi
fi

echo "Pushing app"

echo "PROJECT_ID is '${PROJECT_ID}'"

gcloud run deploy govuk-knowledge-graph-search \
  --source . \
  --region "europe-west2" \
  --tag commit-`git rev-parse --short HEAD` \
  --project "${PROJECT_ID}"

echo "Done"
