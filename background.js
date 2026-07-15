// The oracle fetches data from a decentralized source (Arweave via Warp DRE gateway).
const STATUS_ORACLE_URL = "https://dre-1.warp.cc/contract/?id=332H4fFgXev5R63Ca9aGotLVqUg3lq_Rjl1SC2KKYcM";

function setAnimatedIcon(status) {
  if (status.includes("alive") || status.includes("recovering")) {
    chrome.action.setTitle({ title: "Status: Recovering / Alive (Oracle Confirmed)" });
    chrome.action.setIcon({ path: "icon_alive.png" });
  } else if (status.includes("dead") || status.includes("deceased")) {
    chrome.action.setTitle({ title: "Status: Deceased (Oracle Confirmed)" });
    chrome.action.setIcon({ path: "icon_dead.png" });
  } else {
    chrome.action.setTitle({ title: "Status: Unknown (Data Pending)" });
    chrome.action.setIcon({ path: "icon_unknown.png" });
  }
}

async function checkMcConnellStatus() {
  try {
    const response = await fetch(STATUS_ORACLE_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const state = data.state;
    
    if (!state || !state.status) {
        throw new Error("Missing status in contract state");
    }

    const status = state.status.toLowerCase();
    setAnimatedIcon(status);
    
    let ts = state.lastUpdatedAt;
    if (typeof ts === 'number' && ts < 10000000000) {
       ts = ts * 1000;
    } else if (!ts) {
       ts = Date.now();
    }

    const statusData = {
        status: status,
        timestamp: ts,
        contractTxId: "332H4fFgXev5R63Ca9aGotLVqUg3lq_Rjl1SC2KKYcM"
    };
    
    chrome.storage.local.set({ mcconnellStatus: statusData });
  } catch (error) {
    console.error("Oracle fetch failed:", error);
    setAnimatedIcon("unknown");
    chrome.storage.local.set({ mcconnellStatus: { status: "unknown", timestamp: Date.now() } });
  }
}

chrome.alarms.create("checkMcConnell", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkMcConnell") checkMcConnellStatus();
});

chrome.runtime.onInstalled.addListener(() => {
  checkMcConnellStatus();
});
