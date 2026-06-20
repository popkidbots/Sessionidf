const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    if (!num) {
        return res.status(400).send({ code: "❗ No number provided" });
    }

    async function NEXUS_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            // Rotate browser fingerprints to avoid WhatsApp bans
            const browsers = ["Chrome", "Firefox", "Edge"];
            const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];

            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(
                        state.keys,
                        pino({ level: "fatal" }).child({ level: "fatal" })
                    ),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS(randomBrowser),
                connectTimeoutMs: 60_000,
                defaultQueryTimeoutMs: 60_000,
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                console.log(`📲 Pair code generated for ${num}: ${code}`);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000);

                    const credsPath = `${__dirname}/temp/${id}/creds.json`;

                    if (!fs.existsSync(credsPath)) {
                        console.log("❗ creds.json not found after connection");
                        await sock.ws.close();
                        await removeFile('./temp/' + id);
                        return;
                    }

                    try {
                        const mega_url = await upload(
                            fs.createReadStream(credsPath),
                            `${sock.user.id}.json`
                        );

                        // New prefix: NEXUS___ with longer encoded session string
                        const rawKey = mega_url.replace('https://mega.nz/file/', '');
                        // Pad/extend session string with a unique fingerprint suffix
                        const fingerprint = Buffer.from(sock.user.id + Date.now()).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
                        const session_string = `NEXUS___${rawKey}__${fingerprint}`;

                        const greeting = `*🌐 NEXUS SESSION CONNECTED*\n\n✅ *Session ID Generated*\n🔐 Save this securely — do not share!\n\n\`\`\`${session_string}\`\`\`\n\n📢 https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T\n💻 https://github.com/popkidmain\n\n⚡ Powered by NEXUS MD`;

                        let sentMsg = await sock.sendMessage(sock.user.id, { text: session_string });

                        await sock.sendMessage(sock.user.id, {
                            text: greeting,
                            contextInfo: {
                                externalAdReply: {
                                    title: "NEXUS MD — Session Ready",
                                    body: "Your session is live. Keep it safe.",
                                    thumbnailUrl: "https://files.catbox.moe/j9ia5c.png",
                                    sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: sentMsg });

                        console.log(`✅ ${sock.user.id} — Session sent & cleaned up`);

                    } catch (uploadErr) {
                        console.error("Upload/send error:", uploadErr.message);
                        // Still notify the user on WhatsApp even if upload failed
                        await sock.sendMessage(sock.user.id, {
                            text: `❗ Session upload failed: ${uploadErr.message || String(uploadErr)}\n\nPlease retry pairing.`
                        });
                    }

                    await delay(500);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);

                } else if (
                    connection === "close" &&
                    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut &&
                    lastDisconnect?.error?.output?.statusCode !== 401
                ) {
                    console.log("🔁 Reconnecting...");
                    await delay(3000);
                    NEXUS_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("Pairing error:", err.message);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "❗ Service Unavailable — Try again" });
            }
        }
    }

    return await NEXUS_PAIR_CODE();
});

module.exports = router;
