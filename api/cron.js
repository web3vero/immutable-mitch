const { WarpFactory } = require('warp-contracts');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const CONTRACT_TX_ID = process.env.CONTRACT_TX_ID || 'YOUR_CONTRACT_ID';
// The wallet should be stored securely as a Base64 encoded string in Vercel Environment Variables
const WALLET_B64 = process.env.ARWEAVE_WALLET_B64;

const SOURCES = {
    "Wikidata": "https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q355522&property=P570&format=json",
    "NYT_RSS": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "FoxNews_RSS": "https://moxie.foxnews.com/google-publisher/politics.xml",
    "Politico_RSS": "https://rss.politico.com/politics-news.xml"
};

const KEYWORDS = ["dead", "dies", "deceased", "passes away", "passed away", "death"];
const TARGET_NAME = ["mitch mcconnell", "mcconnell"];

module.exports = async (req, res) => {
    // 1. Enforce CRON_SECRET to prevent DDoS & Execution draining
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized / Missing CRON_SECRET" });
    }

    try {
        const results = await fetchAllSourcesSafe();
        const score = Object.values(results).filter(v => v === true).length;
        
        console.log(`Consensus Score: ${score}/4`);
        
        if (score >= 3) {
            console.log("Consensus reached. Pushing transaction to Arweave L2 (Irys)...");
            // Fire and forget - do not await the final settlement to prevent Vercel 10s timeout
            updateSmartWeave().catch(e => console.error("SmartWeave Update Failed:", e.message));
            
            return res.status(200).json({ success: true, message: "Consensus reached. Oracle update initiated.", score });
        } else {
            return res.status(200).json({ success: true, message: "Status Alive / No consensus.", score });
        }
    } catch (e) {
        console.error("Critical Oracle Error:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

async function fetchAllSourcesSafe() {
    const results = { Wikidata: false, NYT_RSS: false, FoxNews_RSS: false, Politico_RSS: false };
    
    // Configure AbortController for strict timeouts (3000ms max per request)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); 

    const fetchPromises = [
        checkWikidata(controller.signal).then(res => results.Wikidata = res).catch(e => console.warn("Wikidata error:", e.message)),
        checkRSS(SOURCES.NYT_RSS, controller.signal).then(res => results.NYT_RSS = res).catch(e => console.warn("NYT error:", e.message)),
        checkRSS(SOURCES.FoxNews_RSS, controller.signal).then(res => results.FoxNews_RSS = res).catch(e => console.warn("Fox error:", e.message)),
        checkRSS(SOURCES.Politico_RSS, controller.signal).then(res => results.Politico_RSS = res).catch(e => console.warn("Politico error:", e.message))
    ];

    // Promise.allSettled ensures we don't crash if one API is down
    await Promise.allSettled(fetchPromises);
    clearTimeout(timeout);

    return results;
}

async function checkWikidata(signal) {
    const response = await axios.get(SOURCES.Wikidata, { signal, timeout: 3000 });
    const data = response.data;
    
    // Anti-Sniping Check could be enforced here by reading the lastrevid timestamp
    if (data.claims && data.claims.P570) {
        return true;
    }
    return false;
}

async function checkRSS(url, signal) {
    // maxContentLength prevents Out-Of-Memory via excessively large hijacked payloads (1MB limit)
    const response = await axios.get(url, { signal, timeout: 3000, maxContentLength: 1000000 }); 
    
    // XML Parsing with safe settings (prevent XXE / XML Bombs)
    const parser = new XMLParser({
        ignoreAttributes: true,
        parseTagValue: false
    });
    
    const jsonObj = parser.parse(response.data);
    
    let feedItems = [];
    if (jsonObj && jsonObj.rss && jsonObj.rss.channel && jsonObj.rss.channel.item) {
        feedItems = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];
    }
    
    for (const item of feedItems) {
        const textToSearch = `${item.title || ""} ${item.description || ""}`.toLowerCase();
        const nameMentioned = TARGET_NAME.some(n => textToSearch.includes(n));
        if (nameMentioned) {
            const deathMentioned = KEYWORDS.some(k => textToSearch.includes(k));
            if (deathMentioned) return true;
        }
    }
    return false;
}

async function updateSmartWeave() {
    if (!WALLET_B64) {
        console.warn("No ARWEAVE_WALLET_B64 provided. Dry run only.");
        return;
    }
    
    const wallet = JSON.parse(Buffer.from(WALLET_B64, 'base64').toString('utf8'));
    
    // Initialize Warp using Mainnet configuration
    const warp = WarpFactory.forMainnet(); 
    const contract = warp.contract(CONTRACT_TX_ID).connect(wallet);

    // Write Interaction (uses Irys/Bundlr for L2 instant sequenced receipts)
    const { originalTxId } = await contract.writeInteraction({
        function: 'updateStatus',
        status: 'dead'
    });
    console.log(`Interaction sequenced successfully. TxID: ${originalTxId}`);
}
