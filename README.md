# Gov Search (frontend)

Gov Search is a search engine for GOV.UK, with advanced functionality for
content designers. This repository includes the code of the GovSearch front-end.

This is an ExpressJS application written in TypeScript. It shows the user a
search interface and queries the backend to fetch and display search results.

The full documentation is available in the [Data Community Tech
Docs](https://docs.data-community.publishing.service.gov.uk).

# Running locally

- Prerequisite: you need to be logged in to gcloud (using the `gcloud` command) and have access to BigQuery (specifically you need the `BigQuery Viewer` and `BigQuery Job Runner` roles). Ask a BigQuery admin to add you.

- Clone this repository
- Run `npm install` to install all dependencies
- Run `npm run build`
- Install [Sass](https://sass-lang.com/install) and compile the Sass sources to CSS with `sass ./src/frontend/scss/main.scss > ./public/main.css`

- Install [webpack](https://webpack.js.org/) and compile the browser-side Typescript code to JavaScript by just running `webpack`

- Copy assets from the GOVUK Frontend run `npm run copy-assets`

- Set an environment variable called PROJECT_ID to the name of the GCP project
  your server will be running on. This is so the server knows where to connect
  to to run searches get the data. For instance, use `govuk-knowledge-graph-dev`
  to get the data from the development backend.

- Set an environment variable called `ENABLE_AUTH` to `"false"` (or anthing but
  `"true"`, or don't set one at all), as you won't need authentication on your
  local machine

- Start the server with `npm run dev`.

- Point your browser to `http://localhost:8080` (the port can be changed using the `PORT` environment variable)

# Developing

## Files

- `src/backend/app.ts`: the main server file. All the `.ts` files in the same folder are server-side code.

- `src/backend`: the server-side files.

- `src/frontend`: the main browser-side files. `webpack` compiles everything to `public/main.js`.

- `src/scss/main.scss`: the Sass file that `sass` compiles to `public/main.css`

- `./public/assets`: publicly served fonts and images

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

# unit tests

We use [Jest](https://jestjs.io)
`npm run test`

# end-to-end tests

We use [Cypress](https://docs.cypress.io), which is installed automatically on installing the `dev` npm packages. If Chrome is installed on your system it should be as simple as running `npx cypress open` for the interactive version and `npx cypress run` for the command-line version.

To run a single test file , use `--spec`. For instance:

`cypress run --spec cypress/e2e/url.cy.ts`

## Deployment

### Staging Deployment

Staging deployment is triggered automatically whenever a pull request is merged into the main branch.

This is made possible by the deploy-staging GitHub Action.

Steps:

1. Create your feature/fix on a new branch.
2. Create a PR targeting the main branch.
3. Ensure the PR passes all the CI checks and has been approved
4. Merge
5. The action will deploy the changes. CloudRun revisions that have been deployed automatically start with the "main-" prefix.

Manually:
You can also trigger the workflow manually in the actions tab of the repo, by selecting the "deploy-staging" workflow.

### Production Deployment

Production deployments have to be triggered manually for security reasons.

1. After testing the changes in the staging environment, create a PR of the main branch against the production branch.
2. Review and approve the PR.
3. Merge the PR.
4. Wait for completion of the `create-release-tag` GitHub Action. It will create a new release and a tag in the GitHub repository for every production deployment.
5. Once the release appears in the repository, manually run the production-deploy workflow. Select the `latest` tag from the `production` branch.
6. (Optional) Write a custom description for the release in Github.

### Please note:

- Deployments from local machine should be limited to the development environment.
- The deploy-staging GitHub Action will run again during the PR from main to production. This is expected and won't cause issues.
- There may be a slight delay (usually less than a minute) before the new release appears in the repository after the create-release-tag action has completed.

## Deployment Steps

1. Go to production site https://gov-search.service.gov.uk/ and view the source.
2. Look for the line beginning `<!-- Google Tag Manager (noscript) --><noscript><iframe src="https://www.googletagmanager.com/ns.html?` and note the values of the URL parameters `id` and `gtm_auth`. They look like `GTM-XXXXXXX` and `aWEg5ABBXXXXXXXXXXXXXXXXX`.
3. Run the script `deploy-to-gcp.sh` located at the root directory
4. Enter the value of `id` as in step 2 as the GTM tracking ID.
5. Enter the value of `gtm_auth` in step 3 as the GTM AUTH.
6. You may be prompted to authenticate with `gcloud run login`, in which case do so and start again.
7. Choose the GCP region `europe-west2`
8. Continue. Check in the [web console](https://console.cloud.google.com/run/detail/europe-west2/govuk-knowledge-graph-search/revisions?project=govuk-knowledge-graph) that a revision was deployed, and try using it at https://govgraphsearch.dev.

## Logging

We use Pino for logging.
Pino enables structured logging, human-readable formatting, top-notch performance.

⚠️⚠️ Pino doesn't behave the same as `console.log`. ⚠️⚠️

You can't pass it infinite arguments. Instead, it's one string at a time.
If you want to log an object alongside your log, then pass the _object as the first argument, then the string_.

e.g

```javascript
console.log('this', 'is', 'a', 'test')
// =
log.info('this is a test')

console.log('Look at this object', { ...anObject })
// =
log.info({ ...anObject }, 'Look at this object')

console.log('A few objects', { ...obj1 }, { ...obj2 })
// Separate your logs instead
log.info('A few objects')
log.info({ ...obj1 }, 'Object 1')
log.info({ ...obj2 }, 'Object 2')

// This WONT WORK
// Second object will be swallowed as objects go to the first argument only.
log.info(obj1, obj2)
```

If you want the request object logged alongside:

```javascript
function middeware(req, res, next) {
  req.log.info('A log')
  // logs: {...req} A log
}
```

To use the logger otherwise:

```javascript
import log from './utils/logging'

log.info('in msg')
log.debug('debug msg')
log.error('error')
log.error(error, 'error')

// If you want to log an object:
log.info({ a: 123, b: 456 }, 'This is a log')
```
