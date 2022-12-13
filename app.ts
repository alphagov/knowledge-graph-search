// Import the express in typescript file
import express from 'express';
import { postToNeo4j } from './db-proxy';
//import { SearchParams } from './search-types.js';

// Initialize the express engine
const app: express.Application = express();

// Take a port 3000 for running server.
const port: number = 3000;

app.use(express.static('public'));
app.use(express.json());



app.post('/neo4j', async (req, res) => {
  try {

    // curl -d '{"statements": [{"statement": "MATCH (t:Taxon) RETURN t.name"}]}' -H "Authorization: Basic XXXXXXXXXXXX==" -H "Content-Type: application/json"  https://knowledge-graph.integration.govuk.digital:7473/db/neo4j/tx | jq .

    const data = await postToNeo4j(req.body);
    res.send(data);
  } catch (e) {
    console.log('neo4j proxy fail:', JSON.stringify(e));
    res.status(500).send(`neo4j proxy fail: ${e}`);
  }
});


// // Handling '/' Request
// app.get('/', (_req, _res) => {
//   _res.send("TypeScript With Express");
// });

// Server setup
app.listen(port, () => {
  console.log(`TypeScript with Express
		http://localhost:${port}/`);
});
