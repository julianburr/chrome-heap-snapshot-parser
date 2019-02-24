/**
 * Get all node branch available from given nodes recursively
 * to allow us to select specific branches and calculate e.g.
 * the retained size of a node from them
 * @param  {Array} branches
 * @param  {Object} node
 * @return {Array}
 */
function getBranches (branches, branch, node, nodes) {
  if (!node.edges.length) {
    return [ ...branches, branch ];
  }
  node.edges.forEach((edge) => {
    const edgeNode = nodes.find((n) => n.index === edge.to_node);
    if (edgeNode && !branch.find((node) => node.index === edgeNode.index)) {
      branches = getBranches(
        branches,
        [ ...branch, { index: edgeNode.index, self_size: edgeNode.self_size } ],
        edgeNode,
        nodes
      );
    }
  });
  return branches;
}
/**
 * Get all possible branches for given nodes
 * @param  {Array} nodes
 * @return {Array}
 */
function getAllBranches (nodes) {
  return nodes
    .map((node) =>
      getBranches(
        [],
        [ { index: node.index, self_size: node.self_size } ],
        node,
        nodes
      )
    )
    .reduce((all, i) => [ ...all, ...i ], []);
}

function getBranchesForNodes (nodes, allNodes) {
  return nodes
    .map((node) => getBranches([], [ node ], node, allNodes))
    .reduce((all, i) => [ ...all, ...i ], []);
}

/**
 * Calculate retained size of a given node determined from
 * given branches
 * @param  {Array} branches
 * @param  {Object} node
 * @return {Number}
 */
function getRetainedSize (branches, node) {
  return (
    node.self_size +
    branches
      .filter((branch) => branch[0].index === node.index)
      .reduce((sum, node) => sum + node.self_size, 0)
  );
}

/**
 * Parse heap snapshot to readable format
 * https://github.com/soney/constraintjs/blob/7bcd08bd9fbd6596dd978b201410fab502873f4e/test/memory_test_extension/background.js
 * @param  {Object} snapshotJson
 * @return {Object}
 */
function parse (snapshotJson) {
  const meta = snapshotJson.snapshot.meta;
  const strings = snapshotJson.strings;
  const nodes = snapshotJson.nodes;
  const edges = snapshotJson.edges;

  const node_types = meta.node_types;
  const node_types_0 = node_types[0];
  const edge_types = meta.edge_types;
  const edge_types_0 = edge_types[0];

  const node_fields = meta.node_fields;
  const node_field_len = node_fields.length;
  const edge_fields = meta.edge_fields;
  const edge_field_len = edge_fields.length;

  let edge_index = 0;
  let num_nodes = snapshotJson.snapshot.node_count;

  let node;
  let edge_count;
  let edge;
  let edge_field_value;
  let node_field_value;

  let computed_nodes = [];

  // Loop through all nodes and put information from different places
  // together properly
  for (let i = 0; i < num_nodes; i++) {
    node = computed_nodes[i] = { edges: [] };
    for (let j = 0; j < node_field_len; j++) {
      node_field_value = nodes[node_field_len * i + j];
      if (j === 0) {
        node[node_fields[j]] = node_types_0[node_field_value];
      } else if (j === 1) {
        node[node_fields[j]] = strings[node_field_value];
      } else {
        node[node_fields[j]] = node_field_value;
      }
    }
    node.index = i;

    // Go through outgoing edges
    edge_count = node.edge_count;
    for (let k = 0; k < edge_count; k++) {
      edge = node.edges[k] = {};
      for (let l = 0; l < edge_field_len; l++) {
        edge_field_value = edges[edge_index];
        if (l === 0) {
          edge[edge_fields[l]] = edge_types_0[edge_field_value];
        } else if (l === 1) {
          edge[edge_fields[l]] = strings[edge_field_value];
        } else {
          edge[edge_fields[l]] = edge_field_value;
        }
        edge.index = edge_index;
        edge_index++;
      }
    }
  }

  return computed_nodes;
}

module.exports = { parse };
