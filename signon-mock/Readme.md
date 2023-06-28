# signon-mock

signon-mock is a local mock server that simulates the behavior of a resource server in the OAuth2 protocol. It is an Express application running on port 3005, designed to allow local development with Govsearch.

## Features

- Replicates the behavior of a resource server in the OAuth2 protocol
- Uses nunjucks templates for rendering the authorisation page (displays only a link)
- Compatible with Govsearch for local development
- Supports local Redis using Docker and Docker Compose

## Usage

1. In a shell:

```shell
$ docker-compose up redis
```

2. In another tab:

```shell
npm install local
npm run local
```

3. In another tab:

```shell
$ cd signon-mock
$ npm run dev
```

4. Open your browser and navigate to `localhost:8080` to initiate the OAuth2 authorisation process. Check that a cookie called `connect.sid` was created in the browser.

## Logging out with `/reauth`

1. Obtain the user ID from either the shell logs or the Redis store (see section below).
2. Open the following URL in your browser, replacing `<userId>` with the actual user ID:

```
http://localhost:3005/reauth/<userId>
```

3. Verify that you are prompted to log into Govsearch again when attempting to access it and that the session associated with the user ID was deleted from the Redis store

## Testing the Redis Entries

1. Install Redis using Homebrew (if not already installed):

```shell
$ brew install redis
```

2. Connect to the Redis server (ensure Redis is runnin in Docker, see "usage" section above)

```shell
$ redis-cli -h localhost
```

3. Retrieve all keys:

```shell
$ KEYS *
```

4. Retrieve the value for a key:

```shell
$ GET <session-key>
```
