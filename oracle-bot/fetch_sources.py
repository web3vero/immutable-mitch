import urllib.request
import json
import re
import xml.etree.ElementTree as ET
import time
import subprocess
import os

SOURCES = {
    "Wikidata": "https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q355522&property=P570&format=json",
    "NYT_RSS": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "FoxNews_RSS": "https://moxie.foxnews.com/google-publisher/politics.xml",
    "Politico_RSS": "https://rss.politico.com/politics-news.xml"
}

# Keywords for death and target name
KEYWORDS = [r"\bdead\b", r"\bdies\b", r"\bdeceased\b", r"\bpasses away\b", r"\bpassed away\b", r"\bdeath\b"]
TARGET_NAME = [r"\bmitch\s+mcconnell\b", r"\bmcconnell\b"]

def check_wikidata():
    try:
        req = urllib.request.Request(SOURCES["Wikidata"], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            # P570 is the Wikidata property for Date of Death
            if "claims" in data and "P570" in data["claims"]:
                return True, "Wikidata has a date of death (P570)."
            return False, "Wikidata reports alive."
    except Exception as e:
        return False, f"Wikidata error: {e}"

def check_rss(url, source_name):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            
            for item in root.findall('.//item'):
                title = item.find('title')
                desc = item.find('description')
                
                title_text = title.text.lower() if title is not None and title.text else ""
                desc_text = desc.text.lower() if desc is not None and desc.text else ""
                text_to_search = title_text + " " + desc_text
                
                name_mentioned = any(re.search(pattern, text_to_search) for pattern in TARGET_NAME)
                if name_mentioned:
                    death_mentioned = any(re.search(pattern, text_to_search) for pattern in KEYWORDS)
                    if death_mentioned:
                        return True, f"Match found in {source_name}: {title.text}"
        return False, f"No match in {source_name}."
    except Exception as e:
        return False, f"{source_name} error: {e}"

def main():
    print("Checking sources for Mitch McConnell's status...")
    results = {}
    
    # 1. Check Wikidata
    is_dead_wiki, msg_wiki = check_wikidata()
    results["Wikidata"] = is_dead_wiki
    print(f"Wikidata: {msg_wiki}")
    
    # 2. Check RSS feeds
    rss_sources = ["NYT_RSS", "FoxNews_RSS", "Politico_RSS"]
    for src in rss_sources:
        is_dead, msg = check_rss(SOURCES[src], src)
        results[src] = is_dead
        print(f"{src}: {msg}")
        time.sleep(1) # Polite delay
        
    score = sum(1 for v in results.values() if v)
    total = len(results)
    
    print("\n--- Consensus Result ---")
    print(f"Consensus Score: {score}/{total} sources confirm passing.")
    
    # Require at least 3 sources to be extremely robust against fake news
    if score >= 3:
        print("ALERT: Consensus reached. High probability event confirmed.")
        print("Triggering automated Arweave SmartWeave contract update...")
        # Automatically fire the NodeJS Arweave update script
        script_dir = os.path.dirname(os.path.realpath(__file__))
        subprocess.run(["node", os.path.join(script_dir, "update_arweave.js")])
    elif score > 0:
        print("WARNING: Conflicting reports. Possible fake news or unconfirmed breaking news.")
    else:
        print("Status: Alive / No reports of passing.")

if __name__ == "__main__":
    main()
