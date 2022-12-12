import express from 'express';
import { postToNeo4j } from './db-proxy.mjs';

const app = express();
const port = process.env.PORT || 3000;

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


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
