const fs = require('fs');
const path = require('path');
const { WarpFactory } = require('warp-contracts');

// Configuration constants
const CONTRACT_TX_ID = process.env.CONTRACT_TX_ID || 'PLACEHOLDER_CONTRACT_TX_ID';
const WALLET_PATH = process.env.WALLET_PATH || path.join(__dirname, 'wallet.json');

async function updateArweaveStatus() {
  console.log(`[${new Date().toISOString()}] Starting Arweave status update...`);
  
  try {
    // 1. Read the wallet
    if (!fs.existsSync(WALLET_PATH)) {
      throw new Error(`Wallet file not found at ${WALLET_PATH}`);
    }
    const wallet = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));

    // 2. Initialize Warp (Mainnet)
    const warp = WarpFactory.forMainnet();

    // 3. Connect to the contract
    const contract = warp.contract(CONTRACT_TX_ID).connect(wallet);

    // 4. Perform the write interaction
    console.log(`Sending write interaction to contract ${CONTRACT_TX_ID}...`);
    const { originalTxId } = await contract.writeInteraction({
      function: 'updateStatus',
      status: 'dead'
    });

    console.log(`[SUCCESS] Interaction pushed. TxID: ${originalTxId}`);
  } catch (error) {
    console.error(`[ERROR] Failed to update Arweave state:`, error.message);
    if (error.stack) console.error(error.stack);
    
    // Exit with a non-zero status code so cron jobs/external tools detect the failure
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  updateArweaveStatus();
}

module.exports = { updateArweaveStatus };
