# knowledge-graph-search

This is a single-page app providing a simple way to query the GovGraph
without having to use Cypher.


# Running

You need a running Neo4j server, whose details should be put in the following environment
variables: `NEO4JSERVER`, `NEO4JUSER` and `NEO4JPWD`.

- clone this repository on a server
- install the govuk design system with `npm install` (needs NodeJS installed)
- run the server with `npm run`
  (or `NEO4JSERVER=localhost NEO4JUSER=user NEO4JPWS=abc123 npm run`)
- Point your browser to `https://localhost:3000` (the port can be changed using the `PORT` environment variable)

# Developing

This is an ExpressJS app, but the only server logic (in `app.mjs`) is to serve static assets and proxy the Neo4j API endpoint.

## Files

- `app.mjs`: the main server file

- `public/js/*`:  the main browser-side application code. See below.

- `public/main.scss`: sass file, that compiles to `main.css` with `sass main.scss > main.css`

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
