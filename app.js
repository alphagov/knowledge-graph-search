import express from 'express';
import got from 'got';

const app = express();
const port = 3000;



app.use(express.static('public'));


// TODO: move to secrets
const neo4jParams = {
  endpoint: 'https://knowledge-graph.integration.govuk.digital:7687/db/neo4j/tx',
  user: 'neo4j',
  password: 'nottobeshared'
};


app.post('/neo4j', async (req, res) => {

  console.log(req.body);

  res.send('meh');
/*
  const {data} = await got.post(neo4jParams.endpoint, {
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(neo4jParams.user + ":" + neo4jParams.password)
    }
  }).json();
  res.send(data);
*/
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
