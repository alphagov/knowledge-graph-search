/* global d3 */
'use strict';


let nodes = [];
let links = [];

const updateD3graph = function(node, neighbours) {

  const d3Node = node.records[0]._fields[0].properties;
  const d3Neighbours = neighbours.records.map(r => r._fields[0].properties);

  const d3NeighboursWithId = d3Neighbours.map(neighbour => {
    return {
      ...neighbour,
      id: neighbour.contentID
    }
  }).concat([{ ...d3Node, id: d3Node.contentID }]);

  const distinctNodes = Array.from(new Set(d3NeighboursWithId.map(JSON.stringify))).map(JSON.parse);

  const newLinks = d3Neighbours.map(n => {
    return {
      source: d3Node.contentID,
      target: n.contentID,
      id: [d3Node.contentID, n.contentID].sort().join()
    };
  }).filter(l => l.source !== l.target);

  const distinctLinks = Array.from(new Set(newLinks.map(JSON.stringify))).map(JSON.parse);


  nodes = distinctNodes;
  links = distinctLinks;
};


const svg = d3.select('#graph');
const width = +svg.attr('width');
const height = +svg.attr('height');


let simulation;

const dragstarted = function(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

const dragged = function(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

const dragended = function(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

const dragBehaviour = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);


const runQuery = async function(neo4jSession, contentId) {
  let thisNode = await (neo4jSession.run(`MATCH (n:Cid {contentID: "${contentId}"}) RETURN n`));
  let neighbours = await (neo4jSession.run(`MATCH(n:Cid {contentID: "${contentId}"}) -[:HYPERLINKS_TO]-> (p:Cid) RETURN p`));
  updateD3graph(thisNode, neighbours);
  plot(neo4jSession);
}


const makeViz = async function (neo4jSession) {
  runQuery(neo4jSession, 'cc357863-4cc9-445e-87a7-fc3f89262f17');
};


const svgLinks = svg.append("g")
  .attr("class", "links");

const svgNodes = svg.append("g")
  .attr("class", "nodes");

const plot = function(neo4jSession) {



  const link = svgLinks
    .selectAll("line.link")
    .data(links, d => d.id);


  link
    .enter()
      .append("line")
        .attr("class", "link")
        .attr("id", d => d.id);
  link
    .exit().remove();

  const node = svgNodes
    .selectAll("g.node")
    .data(nodes, d => d.id);

  const nodeG = node
    .enter().append("g")
      .attr("class", "node")
      .attr("id", d => d.id);

  node
    .exit().remove();

  node.call(dragBehaviour);

  nodeG
      .append("circle")
        .attr("r", 12)
        .attr("fill", "red")
        .on('click', (event, d) => runQuery(neo4jSession, d.id));

  nodeG.append("title")
    .text(d => `${d.id}\n${d.title}`);

  nodeG.append("text")
    .text(d => d.title.slice(0,15)+'...')
    .attr('x', 6)
    .attr('y', 3)
    .attr('xlink:href', d => `https://gov.uk${d.name}`);



  // Force simulation
  const ticked = function() {
    svgLinks.selectAll('line.link')
      .attr("x1", d=> d.source.x)
      .attr("y1", d=> d.source.y)
      .attr("x2", d=> d.target.x)
      .attr("y2", d=> d.target.y)
    svgNodes.selectAll('g.node')
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
  }

  simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-3000))
      .force("center", d3.forceCenter(width / 2, height / 2));

  simulation
    .nodes(nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(links);
};
