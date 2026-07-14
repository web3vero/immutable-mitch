// The oracle fetches data from a decentralized source (Arweave/IPFS).
// Currently pointing to our GitHub-hosted fallback oracle until the Arweave smart contract is deployed.
const STATUS_ORACLE_URL = "https://raw.githubusercontent.com/web3vero/immutable-mitch/main/oracle.json";

async function checkMcConnellStatus() {
  try {
    // 1. Fetch the status from the decentralized web
    const response = await fetch(STATUS_ORACLE_URL);
    const statusData = await response.json();

    // Status data is expected to be in a Verifiable Credential (VC) format.
    // Example: { "status": "alive", "timestamp": "...", "source": "..." }
    const status = statusData.status.toLowerCase();

    // 2. Update the extension icon and tooltip based on the status
    if (status.includes("dead") || status.includes("deceased")) {
      chrome.action.setIcon({ path: "icon_dead.png" });
      chrome.action.setTitle({ title: "Status: Deceased (Decentralized Oracle Confirmed)" });
    } else if (status.includes("alive") || status.includes("recovering")) {
      chrome.action.setIcon({ path: "icon_alive.png" });
      chrome.action.setTitle({ title: "Status: Recovering / Alive (Decentralized Oracle Confirmed)" });
    } else {
      chrome.action.setIcon({ path: "icon_unknown.png" });
      chrome.action.setTitle({ title: "Status: Unknown (Oracle Data Pending)" });
    }

    // 3. Save the data for the popup
    chrome.storage.local.set({ mcconnellStatus: statusData });

  } catch (error) {
    console.error("Could not fetch status from decentralized oracle:", error);
    chrome.action.setIcon({ path: "icon_unknown.png" });
    chrome.action.setTitle({ title: "Error: Oracle Unavailable" });
  }
}

// Set up an alarm to check every hour (Web3 data is typically updated less frequently)
chrome.alarms.create("checkMcConnell", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkMcConnell") {
    checkMcConnellStatus();
  }
});

// Run immediately on installation
chrome.runtime.onInstalled.addListener(() => {
  checkMcConnellStatus();
});
