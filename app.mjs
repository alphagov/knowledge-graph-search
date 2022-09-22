import express from 'express';
import got from 'got';

const app = express();
const port = process.env.PORT || 3000;


app.use(express.static('public'));
//app.use(express.raw());
app.use(express.json());

// TODO: move to secrets
const neo4jParams = {
  endpoint: 'https://knowledge-graph.integration.govuk.digital:7473/db/neo4j/tx',
  user: 'neo4j',
  password: 'nottobeshared'
};


app.post('/neo4j', async (req, res) => {
  try {

    // curl -d '{"statements": [{"statement": "MATCH (t:Taxon) RETURN t.name"}]}' -H "Authorization: Basic XXXXXXXXXXXX==" -H "Content-Type: application/json"  https://knowledge-graph.integration.govuk.digital:7473/db/neo4j/tx | jq .

    const data = await got.post(neo4jParams.endpoint, {
      json: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(neo4jParams.user + ":" + neo4jParams.password)
      }
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
