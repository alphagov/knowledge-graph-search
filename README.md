# knowledge-graph-search

This is a single-page app providing a simple way to query the GovGraph
without having to use Cypher.


# Running

You need a running Neo4j server, whose details should be put in the following environment
variable: `NEO4JSERVER`.

- clone this repository on a server
- install the govuk design system the server with `npm install` (needs NodeJS installed)
- install webpack on the server with `npm install webpack`
- run webpack with `npx webpack`
- use another machine to compile the GOV.UK Design System with `sass
  src/scss/main.scss > public main.css`, and put `public/main.css` on the
  server. You can install sass with `npm install -g sass`
- run the server with `npm start` (or
  `NEO4JSERVER=https://govgraph.dev:7473/db/neo4j/tx npm start`)

# Developing

This is an ExpressJS app, but the only server logic (in `app.mjs`) is to serve static assets and proxy the Neo4j API endpoint.

Use `npm run dev` instead of `npm start`, because `run dev` automatically
reloads when the source code is changed.

Point your browser to `http://localhost:8080` (the port can be changed using the
`PORT` environment variable)

## Files

- `app.ts`: the main server file

- `public/js/*`:  the main browser-side application code. See below.

- `src/scss/main.scss`: sass file, that compiles to `public/main.css` with `sass
  src/scss/main.scss > public/main.css`

- `package.json`: used to retrieve the Government Design System assets and ExpressJS

- `public/assets`: fonts and images

## CSS

`public/main.css` is generated from `public/main.scss` using `npx sass`.

## JS

`public/main.ts` is generated from the TypeScript sources using `npx webpack`.

## Architecture

The browser-side application uses the [Elm Architecture](https://elmprogramming.com/elm-architecture-intro.html) model. The whole application state is held in a variable called `state`, and a function called `view` renders the HTML that corresponds to the current value of `state`, and sets event handlers on that HTML. Whenever an event happens (user clicks something, or a search returns) the `handleEvent` function updates the state accordingly and runs `view` again. This forms the main interaction loop. For instance:

- The user enters search terms and clicks "search"
- The DOM event handler runs `handleEvent`, which:
  - retrieves the new search terms from the form
  - and updates `state.keywords` with the new values
  - runs the search in neo4j
  - runs `view`
- The page shows the "searching screens" and waits for the next event
- Neo4j finishes searching and calls `handleEvent`, which updates `state` with the search results
- `handleEvent` calls `view`
- `view` renders the state, including the search results.
- The page waits for the next event
etc.

## Running tests

# end-to-end tests

We use [Cypress](https://docs.cypress.io), which is installed automatically on installing the `dev` npm packages. If Chrome is installed on your system it should be as simple as running `npx cypress open` for the interactive version and `npx cypress run` for the command-line version.

To run a single test file , use `--spec`. For instance:

    cypress run --spec cypress/e2e/url.cy.ts
