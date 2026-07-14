#!/bin/bash
# Immutable Mitch Automated Installer

echo "========================================================="
echo "   ___                                                   "
echo "  |_ _|  _ __ ___    _ __ ___   _   _  | |_   __ _       "
echo "   | |  | '_ \` _ \  | '_ \` _ \ | | | | | __| / _\` |      "
echo "   | |  | | | | | | | | | | | || |_| | | |_ | (_| |      "
echo "  |___| |_| |_| |_| |_| |_| |_| \__,_|  \__| \__,_|      "
echo "  __  __   _   _            _                            "
echo " |  \/  | (_) | |_    ___  | |__                         "
echo " | |\/| | | | | __|  / __| | '_ \                        "
echo " | |  | | | | | |_  | (__  | | | |                       "
echo " |_|  |_| |_|  \__|  \___| |_| |_|                       "
echo "                                                         "
echo "========================================================="
echo "[*] Downloading Immutable Mitch Web3 Oracle Extension..."

DEST_DIR="$HOME/immutable-mitch"
if [ -d "$DEST_DIR" ]; then
    echo "[!] Directory $DEST_DIR already exists. Removing old version..."
    rm -rf "$DEST_DIR"
fi

mkdir -p "$DEST_DIR"
curl -sSL https://github.com/web3vero/immutable-mitch/archive/refs/heads/main.zip -o /tmp/immutable-mitch.zip
unzip -q /tmp/immutable-mitch.zip -d /tmp/
mv /tmp/immutable-mitch-main/* "$DEST_DIR/"
rm -rf /tmp/immutable-mitch.zip /tmp/immutable-mitch-main

echo "[*] Download & Extraction complete!"
echo ""
echo "🚀 ACTION REQUIRED TO FINISH INSTALL 🚀"
echo "---------------------------------------------------------"
echo "1. Open Google Chrome or Brave."
echo "2. Go to: chrome://extensions/ (or brave://extensions/)"
echo "3. Turn ON 'Developer mode' in the top right."
echo "4. Click 'Load unpacked' in the top left."
echo "5. Select this folder: $DEST_DIR"
echo "---------------------------------------------------------"
echo ""
echo "💡 Support the Oracle (ETH): 0x11eb37959987acc6854ba0167ef8b06c559fe2f1"
echo "========================================================="
