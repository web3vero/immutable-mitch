// The oracle fetches data from a decentralized source (Arweave/IPFS).
const STATUS_ORACLE_URL = "https://raw.githubusercontent.com/web3vero/immutable-mitch/main/oracle.json";

let animationInterval = null;
let currentFrame = 0;

// Uses OffscreenCanvas to procedurally generate and animate the extension icon!
function setAnimatedIcon(status) {
  if (animationInterval) clearInterval(animationInterval);
  
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');

  function drawEmoji(emoji, angle, yOffset) {
    ctx.clearRect(0, 0, 16, 16);
    ctx.save();
    ctx.translate(8, 8 + yOffset);
    ctx.rotate(angle * Math.PI / 180);
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
    chrome.action.setIcon({ imageData: ctx.getImageData(0, 0, 16, 16) });
  }
  
  function drawTurtle(headOut, angle, yOffset) {
    ctx.clearRect(0, 0, 16, 16);
    ctx.save();
    ctx.translate(8, 8 + yOffset);
    ctx.rotate(angle * Math.PI / 180);
    ctx.translate(-8, -8);

    // Legs
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(3, 11, 2, 3);
    ctx.fillRect(9, 11, 2, 3);

    // Shell
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(7, 10, 5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(2, 10, 10, 2);

    // Shell pattern
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(5, 6, 4, 3);

    if (headOut) {
        // Head sticking out
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.arc(13, 9, 2.5, 0, Math.PI*2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'black';
        ctx.fillRect(13.5, 7.5, 1, 1);
    }
    
    ctx.restore();
    chrome.action.setIcon({ imageData: ctx.getImageData(0, 0, 16, 16) });
  }

  if (status.includes("alive") || status.includes("recovering")) {
    chrome.action.setTitle({ title: "Status: Recovering / Alive (Oracle Confirmed)" });
    // Animate a dancing/bobbing turtle with head OUT!
    animationInterval = setInterval(() => {
      const angle = currentFrame % 2 === 0 ? -10 : 10;
      const yOff = currentFrame % 2 === 0 ? -1 : 1;
      drawTurtle(true, angle, yOff);
      currentFrame++;
    }, 400);
  } else if (status.includes("dead") || status.includes("deceased")) {
    chrome.action.setTitle({ title: "Status: Deceased (Oracle Confirmed)" });
    // Static skull
    drawEmoji('💀', 0, 0);
  } else {
    chrome.action.setTitle({ title: "Status: Unknown (Data Pending)" });
    // Static turtle with head tucked safely INSIDE the shell
    drawTurtle(false, 0, 0);
  }
}

async function checkMcConnellStatus() {
  try {
    const response = await fetch(STATUS_ORACLE_URL);
    const statusData = await response.json();
    const status = statusData.status.toLowerCase();

    setAnimatedIcon(status);
    chrome.storage.local.set({ mcconnellStatus: statusData });
  } catch (error) {
    console.error("Oracle fetch failed:", error);
    setAnimatedIcon("unknown");
  }
}

chrome.alarms.create("checkMcConnell", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkMcConnell") checkMcConnellStatus();
});

chrome.runtime.onInstalled.addListener(() => {
  checkMcConnellStatus();
});
