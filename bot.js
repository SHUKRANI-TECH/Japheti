// === Import Libraries ===
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require('pino');
const readline = require("readline");

// === Function ya kuuliza input kutoka terminal ===
const ask = (q) => new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (ans) => {
        rl.close();
        resolve(ans);
    });
});

async function startBot() {
    console.log("\n=== WhatsApp Multi-Device Login ===\n");

    // === Load / Save Auth Sessions ===
    const { state, saveCreds } = await useMultiFileAuthState('./sessions'); // folder itahifadhi session

    // === Uliza mode ya ku-connect ===
    let mode = await ask("Chagua mode:\n1 - QR Code\n2 - Pairing Code\n👉 ");

    // === Tengeneza WhatsApp Socket ===
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: mode === "1",  // itachapisha QR kama umechagua 1
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // === Save credentials kila zikibadilika ===
    sock.ev.on('creds.update', saveCreds);

    // === Kama umechagua Pairing Mode ===
    if (mode === "2") {
        const phoneNumber = await ask("Ingiza namba ya WhatsApp (mfano 2557XXXXXXX): ");
        console.log("\n⏳ Inaleta pairing code...\n");

        let code = await sock.requestPairingCode(phoneNumber);
        code = code.match(/.{1,4}/g).join("-");
        console.log(`✅ Pairing Code: ${code}`);

        console.log("\n➡ Fungua WhatsApp → Settings → Linked Devices → Approve pairing request\n");
    }

    // === Event: Uki-connect ===
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ Connected! Session imehifadhiwa.");
        } else if (connection === 'close') {
            console.log("❌ Connection closed!", lastDisconnect?.error);
        }
    });
}

// === Run Bot ===
startBot();
