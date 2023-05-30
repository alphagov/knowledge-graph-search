# Gov Search (frontend)

Gov Search is a search engine for GOV.UK, with advanced functionality for
content designers. This repository includes the code of the GovSearch front-end.

This is an ExpressJS application written in TypeScript. It shows the user a
search interface and queries the backend to fetch and display search results.

The full documentation is available in the [Data Community Tech
Docs](https://docs.data-community.publishing.service.gov.uk).

# Running locally

- Prerequisite: you need to be logged in to gcloud (using the `gcloud` command) and have access to BigQuery (specifically you need the `BigQuery Viewer` and `BigQuery Job Runner` roles). Ask a BigQuery admin to add you.

- clone this repository
- run `npm install` to install all dependencies
- Install [Sass](https://sass-lang.com/install) and compile the Sass sources to CSS with

    cd src/scss
    sass main.scss > ../../public/main.css

- Install [webpack](https://webpack.js.org/) and compile the browser-side Typescript code to JavaScript by just running `webpack`

- set an environment variable called PROJECT_ID to the name of the GCP project
  your server will be running on. This is so the server knows where to connect
  to to run searches get the data. For instance, use `govuk-knowledge-graph-dev`
  to get the data from the development backend.

- set an environment variable called `DISABLE_AUTH` to any value, as you won't
  need authentication on your local machine

- Start the server with `npm run dev`.

- Point your browser to `https://localhost:8080` (the port can be changed using the `PORT` environment variable)

# Developing

## Files

- `app.ts`: the main server file. All the `.ts` files in the same folder are server-side code.

- `src/ts/*.ts`: the main browser-side files (some type definitions and
  utilities are also used server-side). `webpack` compiles everything to `/public/main.js`.

- `src/scss/main.scss`: the Sass file that `sass` compiles to `/public/main.css`

- `public/assets`: fonts and images

- `views/index.html`: the HTML source file sent to the browser




## Software architecture

Mostly for historical reasons, much of the functionality offered runs browser-side. That's why the application is more JavaScript-heavy than your usual `alphagov` app. Although the JavaScript code is generated from TypeScript sources, it doesn't use any framework like React.

The browser-side code uses the [Elm Architecture](https://elmprogramming.com/elm-architecture-intro.html) model: the whole application's state is held in a variable called `state`, and a function called `view` renders the HTML that corresponds to the current value of `state`, and sets event handlers on that HTML. Whenever an event happens (user clicks on a button, or a search returns) the `handleEvent` function updates the state accordingly and runs `view` again. This forms the main interaction loop. For instance:

- The user enters search terms and clicks "search"
- The DOM event handler (defined in `view.ts`) triggered runs `handleEvent`, which:
  - retrieves the new search terms from the form
  - and updates the state (specifically `state.selectedKeywords`) with the new values
  - starts the search in BigQuery via the API offered by the ExpressJS server.
  - and meanwhile calls view to show the "Please wait" message.
- Eventually the API call returns and triggers `handleEvent`, which updates
  `state` with the search results
- `handleEvent` also calls `view`
- `view` renders the state, including the search results.
- The page waits for the next event
etc.

## Running tests

# end-to-end tests

We use [Cypress](https://docs.cypress.io), which is installed automatically on installing the `dev` npm packages. If Chrome is installed on your system it should be as simple as running `npx cypress open` for the interactive version and `npx cypress run` for the command-line version.

To run a single test file , use `--spec`. For instance:

    cypress run --spec cypress/e2e/url.cy.ts

## Deployment Steps
  1. Go to production site (https://govgraphsearch.dev/)
  2. Extract the value of GTM Tracking ID like GTM-XXXXXXX
  3. Extract the value of GTM-AUTH like aWEg5ABBTyIPcsSg1cJWxg&gtm_preview=env-59&gtm_cookies_win=x
  4. Run the script deploy-to-gcp.sh located at the root directory
  5. Enter you tracking ID in step 2
  6. Enter GTM_AUTH in step 3
  7. Continue may prompt for gcloun run login, if yes run the command else continue.
  8. Enter your gcl region (europe-west2)
  9. Continue and wait till DONE.

