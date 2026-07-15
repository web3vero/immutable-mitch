const fs = require('fs');
const { WarpFactory } = require('warp-contracts');
const { DeployPlugin, ArweaveSigner } = require('warp-contracts-plugin-deploy');

async function deploy() {
  console.log("Starting deployment...");
  
  // Initialize Warp for mainnet
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  // Load wallet
  let wallet;
  try {
    wallet = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
  } catch (e) {
    console.error("Error: Could not read wallet.json. Make sure you placed your Wander keyfile in the oracle-bot directory as 'wallet.json'.");
    process.exit(1);
  }

  // Get oracle address from wallet
  const oracleAddress = await warp.arweave.wallets.jwkToAddress(wallet);
  console.log(`Oracle Address: ${oracleAddress}`);

  // Load contract source
  const contractSrc = fs.readFileSync('./contract.js', 'utf8');

  // Define initial state
  const initialState = {
    status: "alive",
    oracleAddress: oracleAddress,
    lastUpdatedAt: Date.now(),
    history: []
  };

  console.log("Deploying contract to Arweave...");
  
  try {
    const { contractTxId } = await warp.deploy({
      wallet: wallet,
      initState: JSON.stringify(initialState),
      src: contractSrc
    }, true);
    
    fs.writeFileSync('./tx.txt', contractTxId);
    console.log("✅ Contract successfully deployed!");
    console.log("==========================================");
    console.log(`CONTRACT_TX_ID: ${contractTxId}`);
    console.log("==========================================");
    console.log("Next steps: Save this CONTRACT_TX_ID for your Vercel Environment Variables.");
  } catch (err) {
    console.error("Deployment failed:", err);
  }
}

deploy();
