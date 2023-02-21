# Gov Search

A search engine for GOV.UK, with advanced functionality for content designers


# Running

- clone this repository on a server
- install the govuk design system with `npm install` (needs NodeJS installed)
- set an environment variable called PROJECT_ID to the name of the GCP project
  your server will be running on. This is so the server knows how to connect to
  BigQuery to get the data.
- run the server with `npm run`.
- Point your browser to `https://localhost:8080` (the port can be changed using the `PORT` environment variable)

# Developing

## Files

- `app.ts`: the main server file

- `src/ts/*.ts`: the main browser-side files (some type definitions and
  utilities are also used server-side)

- `public/js/*`:  the main browser-side application code. See below.

- `src/scss/main.scss`: sass file, that compiles to `public/main.css` with `sass
  src/scss/main.scss > public/main.css`

- `package.json`: used to retrieve the Government Design System assets and ExpressJS

- `public/assets`: fonts and images

## CSS

`public/main.css` is generated from `public/main.scss` using sass.

## Architecture

The browser-side application uses the [Elm Architecture](https://elmprogramming.com/elm-architecture-intro.html) model. The whole application state is held in a variable called `state`, and a function called `view` renders the HTML that corresponds to the current value of `state`, and sets event handlers on that HTML. Whenever an event happens (user clicks something, or a search returns) the `handleEvent` function updates the state accordingly and runs `view` again. This forms the main interaction loop. For instance:

- The user enters search terms and clicks "search"
- The DOM event handler runs `handleEvent`, which:
  - retrieves the new search terms from the form
  - and updates `state.keywords` with the new values
  - runs the search in BigQuery via the Search API
  - runs `view`
- The page shows the "searching screens" and waits for the next event
- The search api call finishes and calls `handleEvent`, which updates `state` with the search results
- `handleEvent` calls `view`
- `view` renders the state, including the search results.
- The page waits for the next event
etc.

## Running tests

# end-to-end tests

We use [Cypress](https://docs.cypress.io), which is installed automatically on installing the `dev` npm packages. If Chrome is installed on your system it should be as simple as running `npx cypress open` for the interactive version and `npx cypress run` for the command-line version.

To run a single test file , use `--spec`. For instance:

    cypress run --spec cypress/e2e/url.cy.ts
