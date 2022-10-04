import express from 'express';
import got from 'got';

const app = express();
const port = process.env.PORT || 3000;
const neo4jServer = process.env.NEO4JSERVER || "127.0.0.1";


app.use(express.static('public'));
//app.use(express.raw());
app.use(express.json());

// TODO: move to secrets
const neo4jParams = {
  endpoint: `http://${neo4jServer}:7474/db/neo4j/tx`,
  user: null,
  password: null
};


app.post('/neo4j', async (req, res) => {
  try {

    // curl -d '{"statements": [{"statement": "MATCH (t:Taxon) RETURN t.name"}]}' -H "Authorization: Basic XXXXXXXXXXXX==" -H "Content-Type: application/json"  https://knowledge-graph.integration.govuk.digital:7473/db/neo4j/tx | jq .

    const headers = { 'Content-Type': 'application/json' }
    if (neo4jParams.user || neo4jParams.password) {
      headers.Authorization = 'Basic ' + btoa(neo4jParams.user + ":" + neo4jParams.password);
    }

    const data = await got.post(neo4jParams.endpoint, {
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
