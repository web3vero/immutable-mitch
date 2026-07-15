const { default: axios } = require("axios");

async function run() {
  const query = `
    query {
      transactions(owners:["oXWk66y5vCp-ADvFJnNqN-eF1LDsSje5WUT3JkoeaiI"], tags: [{name: "App-Name", values: ["SmartWeaveContract"]}], first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  `;
  try {
    const res = await axios.post("https://arweave.net/graphql", { query });
    console.log("CONTRACT_TX_ID:", res.data.data.transactions.edges[0].node.id);
  } catch (e) {
    console.error(e);
  }
}
run();
