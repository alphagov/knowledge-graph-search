import express from 'express';
import got from 'got';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx",
  password: process.env.NEO4J_PASSWORD || null,
  username: process.env.NEO4J_USERNAME || null
};


app.post('/neo4j', async (req, res) => {
  try {

    // curl -d '{"statements": [{"statement": "MATCH (t:Taxon) RETURN t.name"}]}' -H "Authorization: Basic XXXXXXXXXXXX==" -H "Content-Type: application/json"  https://knowledge-graph.integration.govuk.digital:7473/db/neo4j/tx | jq .


    const headers = { 'Content-Type': 'application/json' }
    if (neo4jParams.username || neo4jParams.password) {
      headers.Authorization =
        'Basic ' + Buffer.from(neo4jParams.username + ":" + neo4jParams.password, 'binary').toString('base64');
    }

    console.log('url', neo4jParams.url);

    const data = await got.post(neo4jParams.url, {
      json: req.body,
      headers
    }).json();
    res.send(data);
  } catch (e) {
    console.log('got fail', e);
    res.send('got fail', e);
  }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
