document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const sourceText = document.getElementById('source-text');
  const copyBtn = document.getElementById('copy-btn');
  const ethAddress = document.getElementById('eth-address').innerText;
  const copyNotification = document.getElementById('copy-notification');

  chrome.storage.local.get(['mcconnellStatus'], (result) => {
    const data = result.mcconnellStatus;

    if (data && data.status) {
      const status = data.status.toLowerCase();
      statusText.classList.remove('unknown', 'pulse');
      
      if (status.includes("dead") || status.includes("deceased")) {
        statusText.innerText = "DECEASED";
        statusText.className = "status deceased";
      } else if (status.includes("alive") || status.includes("recovering")) {
        statusText.innerText = "ALIVE";
        statusText.className = "status alive";
      } else {
        statusText.innerText = "UNKNOWN";
        statusText.className = "status unknown";
      }
      sourceText.innerText = `NODE SYNC: ${new Date(data.timestamp).toLocaleTimeString()}`;
    } else {
      statusText.innerText = "OFFLINE";
      statusText.className = "status unknown";
      sourceText.innerText = "Awaiting block verification...";
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(ethAddress).then(() => {
      copyNotification.style.opacity = '1';
      setTimeout(() => {
        copyNotification.style.opacity = '0';
      }, 2000);
    });
  });
});
