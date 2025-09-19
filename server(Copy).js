const express = require("express");
const path = require("path");
const cors = require("cors");
const { LowSync } = require("lowdb");
const { JSONFileSync } = require("lowdb/node");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const Tesseract = require("tesseract.js");

// Plugin System
const BotCore = require("./lib/BotCore");
const WebAdapter = require("./lib/adapters/WebAdapter");
const WhatsAppAdapter = require("./lib/adapters/WhatsAppAdapter");

const app = express();

// Initialize Plugin System
const botCore = new BotCore();
const webAdapter = new WebAdapter();
const whatsappAdapter = new WhatsAppAdapter(botCore);
botCore.registerAdapter('web', webAdapter);
botCore.registerAdapter('whatsapp', whatsappAdapter);

// Initialize plugins on startup
(async () => {
  try {
    await botCore.initialize();
    console.log("🎯 Plugin system initialized");
    
    // Auto-start WhatsApp connection if session exists
    try {
      console.log("📱 Starting WhatsApp connection...");
      await whatsappAdapter.connect();
      console.log("✅ WhatsApp bot connected successfully");
    } catch (error) {
      console.log("⚠️ WhatsApp connection failed:", error.message);
    }
  } catch (error) {
    console.error("❌ Plugin system initialization failed:", error);
  }
})();

const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(fileUpload());

// === LowDB Setup ===
const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFileSync(dbFile);
const defaultData = { users: {}, tradingJournals: {} };
const db = new LowSync(adapter, defaultData);

try {
  db.read();
  if (!db.data || !db.data.users || !db.data.tradingJournals) {
    console.warn("Menginisialisasi ulang database karena format lama.");
    db.data = { users: {}, tradingJournals: {} };
    db.write();
  }
} catch (error) {
  console.error("Kesalahan membaca db.json, membuat ulang:", error);
  db.data = { users: {}, tradingJournals: {} };
  db.write();
}

// === Helper ===
function getUser(nama) {
  if (!db.data.users[nama]) {
    db.data.users[nama] = { sessions: {} };
    db.write();
  }
  return db.data.users[nama];
}

function getSession(user, sessionId) {
  if (!user.sessions[sessionId]) {
    user.sessions[sessionId] = [];
    db.write();
  }
  return user.sessions[sessionId];
}

function getUserJournal(nama) {
  if (!db.data.tradingJournals[nama]) {
    db.data.tradingJournals[nama] = [];
    db.write();
  }
  return db.data.tradingJournals[nama];
}

// === WhatsApp Pairing Global Variables ===
let pairingCode = null;
let pairingPhoneNumber = null;
let pairingStatus = 'disconnected'; // disconnected, requesting, waiting, connected, error
let pairingMethod = 'code'; // code or qr
let qrCodeData = null;

// === Routes ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/whatsapp", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "whatsapp.html"));
});

// === WhatsApp Pairing Routes ===
app.post("/whatsapp/start-pairing", async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.json({ status: false, message: "Nomor HP diperlukan" });
  }
  
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  
  if (cleanNumber.length < 10) {
    return res.json({ status: false, message: "Nomor HP tidak valid" });
  }
  
  if (cleanNumber.startsWith('0')) {
    return res.json({ 
      status: false, 
      message: "Gunakan format internasional (contoh: 6281234567890, bukan 081234567890)" 
    });
  }
  
  if (!cleanNumber.startsWith('62') && cleanNumber.length < 12) {
    return res.json({ 
      status: false, 
      message: "Masukkan nomor dengan kode negara (contoh: 6281234567890)" 
    });
  }
  
  try {
    if (whatsappAdapter.sock) {
      await whatsappAdapter.disconnect();
    }
    
    pairingPhoneNumber = cleanNumber;
    pairingStatus = 'requesting';
    pairingCode = null;
    qrCodeData = null;
    
    whatsappAdapter.pairingPhoneNumber = pairingPhoneNumber;
    whatsappAdapter.webPairingMode = true;
    whatsappAdapter.onPairingCode = (code) => {
      pairingCode = code;
      pairingStatus = 'waiting';
    };
    whatsappAdapter.onConnectionUpdate = (status) => {
      pairingStatus = status;
    };
    whatsappAdapter.onQRCode = (qr) => {
      qrCodeData = qr;
      pairingStatus = 'waiting_qr';
    };
    
    setTimeout(() => whatsappAdapter.connect(), 100);
    
    res.json({ 
      status: true, 
      message: "Pairing dimulai...",
      phoneNumber: pairingPhoneNumber
    });
    
  } catch (error) {
    pairingStatus = 'error';
    res.json({ 
      status: false, 
      message: "Gagal memulai pairing: " + error.message 
    });
  }
});

app.get("/whatsapp/pairing-status", (req, res) => {
  res.json({
    status: true,
    pairingStatus,
    pairingCode,
    phoneNumber: pairingPhoneNumber,
    connected: whatsappAdapter.isConnected
  });
});

app.post("/whatsapp/disconnect", async (req, res) => {
  try {
    await whatsappAdapter.disconnect();
    pairingStatus = 'disconnected';
    pairingCode = null;
    pairingPhoneNumber = null;
    res.json({ status: true, message: "WhatsApp diputuskan" });
  } catch (error) {
    res.json({ status: false, message: "Gagal memutus koneksi: " + error.message });
  }
});

app.post("/whatsapp/set-method", (req, res) => {
  const { method } = req.body;
  
  if (!method || !['code', 'qr'].includes(method)) {
    return res.json({ status: false, message: "Method tidak valid (code/qr)" });
  }
  
  pairingMethod = method;
  res.json({ status: true, message: `Method pairing diset ke: ${method}` });
});

app.post("/whatsapp/start-qr", async (req, res) => {
  try {
    if (whatsappAdapter.sock) {
      await whatsappAdapter.disconnect();
    }
    
    pairingStatus = 'requesting';
    pairingCode = null;
    qrCodeData = null;
    pairingMethod = 'qr';
    
    whatsappAdapter.webPairingMode = false;
    whatsappAdapter.pairingPhoneNumber = null;
    whatsappAdapter.onQRCode = (qr) => {
      qrCodeData = qr;
      pairingStatus = 'waiting_qr';
    };
    whatsappAdapter.onConnectionUpdate = (status) => {
      pairingStatus = status;
    };
    
    setTimeout(() => whatsappAdapter.connect(), 100);
    
    res.json({ 
      status: true, 
      message: "QR Mode dimulai..."
    });
    
  } catch (error) {
    pairingStatus = 'error';
    res.json({ 
      status: false, 
      message: "Gagal memulai QR mode: " + error.message 
    });
  }
});

app.get("/whatsapp/qr-status", (req, res) => {
  res.json({
    status: true,
    pairingStatus,
    qrCodeData,
    method: pairingMethod,
    connected: whatsappAdapter.isConnected
  });
});

app.post("/whatsapp/delete-session", async (req, res) => {
  const { pin } = req.body;
  
  if (pin !== '4321') {
    return res.json({ 
      status: false, 
      message: "PIN salah! Akses ditolak." 
    });
  }
  
  try {
    if (whatsappAdapter.isConnected) {
      await whatsappAdapter.disconnect();
    }
    
    const sessionPath = path.join(__dirname, 'whatsapp_session');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('📁 WhatsApp session deleted');
    }
    
    pairingStatus = 'disconnected';
    pairingCode = null;
    pairingPhoneNumber = null;
    qrCodeData = null;
    
    res.json({ 
      status: true, 
      message: "Session berhasil dihapus! Siap untuk pairing baru." 
    });
    
  } catch (error) {
    res.json({ 
      status: false, 
      message: "Gagal menghapus session: " + error.message 
    });
  }
});

app.get("/setname", (req, res) => {
  const { nama } = req.query;
  if (!nama) {
    return res.json({ status: false, message: "Nama kosong" });
  }
  const user = getUser(nama);
  res.json({ status: true, message: `Nama "${nama}" disimpan` });
});

// Endpoint baru untuk mengunggah musik DAN background
app.post("/upload", (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ status: false, message: "Tidak ada file yang diunggah." });
    }

    const musicFile = req.files.music;
    const bgFile = req.files.background;

    let musicUrl = null;
    let bgUrl = null;

    const promises = [];

    // Proses upload file musik
    if (musicFile) {
        if (!musicFile.mimetype.startsWith('audio')) {
            return res.status(400).json({ status: false, message: "Hanya file audio yang diizinkan untuk musik." });
        }
        const uploadDir = path.join(__dirname, "public", "music");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        const uniqueFileName = `${Date.now()}_${musicFile.name}`;
        const uploadPath = path.join(uploadDir, uniqueFileName);
        
        promises.push(
            new Promise((resolve, reject) => {
                musicFile.mv(uploadPath, (err) => {
                    if (err) return reject(err);
                    musicUrl = `/music/${uniqueFileName}`;
                    resolve();
                });
            })
        );
    }

    // Proses upload file background (gambar/video)
    if (bgFile) {
        if (!bgFile.mimetype.startsWith('image') && !bgFile.mimetype.startsWith('video')) {
            return res.status(400).json({ status: false, message: "Hanya file gambar atau video yang diizinkan untuk background." });
        }
        const uploadDir = path.join(__dirname, "public", "background");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        const uniqueFileName = `${Date.now()}_${bgFile.name}`;
        const uploadPath = path.join(uploadDir, uniqueFileName);

        promises.push(
            new Promise((resolve, reject) => {
                bgFile.mv(uploadPath, (err) => {
                    if (err) return reject(err);
                    bgUrl = `/background/${uniqueFileName}`;
                    resolve();
                });
            })
        );
    }

    // Jalankan semua proses upload
    Promise.all(promises)
        .then(() => {
            res.json({
                status: true,
                message: "File berhasil diunggah",
                musicUrl: musicUrl,
                bgUrl: bgUrl
            });
        })
        .catch(err => {
            res.status(500).json({
                status: false,
                message: "Gagal menyimpan file: " + err.message
            });
        });
});

app.get("/history", (req, res) => {
  const { nama, session } = req.query;
  if (!nama || !session) {
    return res.json({ status: false, message: "Nama atau session kosong" });
  }
  try {
    const user = getUser(nama);
    const history = getSession(user, session);
    res.json({ status: true, history });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Gagal mengambil history: " + err.message,
    });
  }
});

app.post("/ai", async (req, res) => {
  const { content, nama, session, visionDescription } = req.body;
  let fileUrl = null;
  let textFromImage = "";
  let visionAnalysis = visionDescription || "";
  let isNsfw = false;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    const uploadDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    
    const uniqueFileName = `${nama}_${session}_${Date.now()}${path.extname(photo.name)}`;
    const uploadPath = path.join(uploadDir, uniqueFileName);

    try {
      await photo.mv(uploadPath);
      fileUrl = `/uploads/${uniqueFileName}`;
      
      try {
        const { data: { text } } = await Tesseract.recognize(
          uploadPath,
          'ind'
        );
        textFromImage = text.trim();
        console.log(`Teks dari gambar "${uniqueFileName}" (oleh ${nama}): ${textFromImage}`);
      } catch (ocrErr) {
        console.error("Gagal melakukan OCR:", ocrErr);
        textFromImage = "Gagal memproses teks dari gambar.";
      }
      const fileNameLower = photo.name.toLowerCase();
      if (fileNameLower.includes('nsfw') || fileNameLower.includes('porn')) {
          isNsfw = true;
          textFromImage = "Foto NSFW terdeteksi. Saya tidak bisa memprosesnya.";
      }
    } catch (err) {
      return res.json({ status: false, message: "Gagal mengunggah foto: " + err.message });
    }
  }

  let photoContent = "";
  if (fileUrl) {
    if (visionAnalysis && visionAnalysis.trim()) {
      photoContent = `[VISION AI]: ${visionAnalysis}`;
      if (textFromImage && textFromImage.trim() && textFromImage !== "tidak ada teks yang bisa dibaca dari foto ini") {
        photoContent += `\n[TEKS DI FOTO]: ${textFromImage}`;
      }
    } else if (textFromImage && textFromImage.trim() && textFromImage !== "tidak ada teks yang bisa dibaca dari foto ini") {
      photoContent = `[TEKS DI FOTO]: ${textFromImage}`;
    } else {
      photoContent = "tidak ada informasi yang bisa dibaca dari foto ini";
    }
  }
  
  const finalContent = content || photoContent;
  
  let availableTools = [];
  try {
    const tools = botCore.getAvailableTools();
    if (tools.length > 0) {
      availableTools = tools.map(t => `${t.name}: ${t.description}`);
    }
  } catch (error) {
    console.log("Error getting tools:", error.message);
  }

  let truncatedContent = finalContent;
  if (finalContent.length > 1800) {
    truncatedContent = finalContent.substring(0, 1800) + "... [teks terpotong karena terlalu panjang]";
  }

  if (!truncatedContent) {
    return res.json({ status: false, message: "Pesan kosong" });
  }
  if (!nama || !session) {
    return res.json({ status: false, message: "Nama atau session kosong" });
  }

  try {
    const user = getUser(nama);
    const history = getSession(user, session);

    let jawaban = null;

    if (isNsfw) {
        jawaban = "Saya tidak bisa memproses konten NSFW. Mohon kirimkan gambar lain.";
    } else {
        const historyPrompt = history.map((h) => {
            const tanya = h.isImage ? `(foto: ${h.tanya})` : h.tanya;
            return `Tanya: ${tanya}\nJawab: ${h.jawab}`;
        }).join("\n\n");
        const isImageMessage = !!fileUrl;
        const promptBella = `
        Kamu adalah Bella, AI buatan Tomii.
        Sekarang kamu ngobrol dengan "${nama}".
        Sesi ID: ${session}
    
        Jawablah semua pertanyaan dalam bahasa Indonesia.
        Jawaban harus singkat (2-3 kalimat), jelas, dan mudah dipahami.
        
        ${availableTools.length > 0 ? `Tools tersedia: ${availableTools.join(', ')}. Sarankan command yang relevan jika user butuh aksi khusus.` : ''}
        Jangan bucin, jangan formal, jangan pakai emotikon berlebihan.
        
        ${isImageMessage ? `User kirim foto. ${visionAnalysis ? `Aku bisa lihat fotonya: ${visionAnalysis}. ${textFromImage && textFromImage !== "tidak ada teks yang bisa dibaca dari foto ini" ? `Dan ada teks: ${textFromImage}` : ''}. Respon santai berdasarkan apa yang aku lihat.` : `Cuma bisa baca teks: ${textFromImage}. Respon santai aja.`}` : ''}
        ---
        Riwayat Percakapan:
        ${historyPrompt}
        ---
        `;
        const response = await fetch(
            `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(
                promptBella
            )}&content=${encodeURIComponent(truncatedContent)}`,
            {
                method: "GET",
                headers: { accept: "*/*" },
            }
        );
        if (!response.ok) {
            const errorDetail = await response.text();
            throw new Error(
                `Gagal fetch dari API eksternal: ${response.status} - ${errorDetail}`
            );
        }
        const data = await response.json();
        jawaban = (data.data || "Bella nggak bisa jawab sekarang").trim();
    }

    history.push({ tanya: fileUrl || truncatedContent, jawab: jawaban, at: Date.now(), isImage: !!fileUrl, isNsfw: isNsfw });
    db.write();

    res.json({ status: true, data: jawaban, history, fileUrl });
  } catch (err) {
    res.json({
      status: false,
      message: "Gagal ambil jawaban AI: " + err.message,
    });
  }
});

app.get("/deletesession", (req, res) => {
  const { nama, session } = req.query;
  if (!nama || !session) {
    return res.json({ status: false, message: "Nama atau session kosong" });
  }
  try {
    const user = getUser(nama);
    if (user && user.sessions[session]) {
      delete user.sessions[session];
      db.write();
      res.json({
        status: true,
        message: `Sesi ${session} berhasil dihapus`,
      });
    } else {
      res.json({ status: false, message: "Sesi tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Gagal menghapus sesi: " + err.message,
    });
  }
});

app.post("/add-trade", (req, res) => {
  const { nama, instrument, lot, position, result, pnl } = req.body;
  
  if (!nama || !instrument || !lot || !position || !result || !pnl) {
    return res.status(400).json({ status: false, message: "Data entri tidak lengkap." });
  }

  try {
    const userJournal = getUserJournal(nama);
    const newTrade = {
      id: userJournal.length + 1,
      instrument,
      lot: parseFloat(lot),
      position,
      result,
      pnl: parseFloat(pnl),
      date: new Date().toISOString()
    };
    
    userJournal.push(newTrade);
    db.write();

    res.json({ status: true, message: "Entri trading berhasil ditambahkan.", data: newTrade });
  } catch (err) {
    res.status(500).json({ status: false, message: "Gagal menyimpan entri trading: " + err.message });
  }
});

app.get("/get-trades", (req, res) => {
  const { nama } = req.query;

  if (!nama) {
    return res.status(400).json({ status: false, message: "Nama pengguna diperlukan." });
  }

  try {
    const userJournal = getUserJournal(nama);
    res.json({ status: true, data: userJournal });
  } catch (err) {
    res.status(500).json({ status: false, message: "Gagal mengambil data trading: " + err.message });
  }
});

app.post("/tools/:toolName", async (req, res) => {
  try {
    const { toolName } = req.params;
    const { input = {}, nama = "ApiUser", session = "api" } = req.body;
    
    const context = {
      chat: {
        platform: 'api',
        chatId: session,
        sender: { id: nama, name: nama, isAdmin: false }
      },
      timestamp: Date.now()
    };
    
    const result = await botCore.callTool(toolName, input, context);
    
    res.json({
      status: true,
      tool: toolName,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Tool execution failed: " + error.message
    });
  }
});

app.get("/tools", (req, res) => {
  try {
    const tools = botCore.getAvailableTools();
    res.json({
      status: true,
      tools,
      total: tools.length
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to get tools: " + error.message
    });
  }
});

app.get("/plugins", (req, res) => {
  try {
    const scannedPlugins = botCore.pluginManager.getAllScannedPlugins();
    const loadedPlugins = botCore.pluginManager.getAllPlugins();
    
    const pluginList = scannedPlugins.map(scanned => {
      const loaded = loadedPlugins.find(l => l.manifest.id === scanned.id);
      return {
        id: scanned.id,
        name: scanned.name,
        version: scanned.version,
        enabled: scanned.enabled,
        active: loaded ? loaded.active : false,
        path: scanned.path,
        type: scanned.type
      };
    });
    
    res.json({ 
      status: true, 
      plugins: pluginList,
      total: pluginList.length 
    });
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Failed to list plugins: " + error.message 
    });
  }
});

app.get("/plugins/catalog", (req, res) => {
  try {
    const catalog = botCore.pluginManager.getCatalogForAI();
    res.json({ 
      status: true, 
      catalog,
      available_commands: botCore.getAvailableCommands(),
      available_tools: botCore.getAvailableTools()
    });
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Failed to get catalog: " + error.message 
    });
  }
});

app.get("/plugins/catalog.llm", (req, res) => {
  try {
    const catalog = botCore.pluginManager.getCatalogForAI();
    const compact = catalog.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      commands: p.commands,
      tools: p.tools.map(t => ({ name: t.name, description: t.description })),
      examples: p.intent_examples,
      enabled: p.enabled
    }));
    
    res.json(compact);
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Failed to get LLM catalog: " + error.message 
    });
  }
});

app.get("/plugins/:id", (req, res) => {
  try {
    const plugin = botCore.pluginManager.getPlugin(req.params.id);
    if (!plugin) {
      return res.status(404).json({ 
        status: false, 
        message: "Plugin not found" 
      });
    }
    
    res.json({ 
      status: true, 
      plugin: {
        ...plugin,
        module: plugin.module ? { loaded: true } : { loaded: false }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Failed to get plugin: " + error.message 
    });
  }
});

app.put("/plugins/:id/enable", async (req, res) => {
  try {
    await botCore.enablePlugin(req.params.id);
    res.json({ 
      status: true, 
      message: `Plugin ${req.params.id} enabled successfully` 
    });
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Failed to enable plugin: " + error.message 
    });
  }
});

app.put("/plugins/:id/disable", async (req, res) => {
  try {
    await botCore.disablePlugin(req.params.id);
    res.json({ 
      status: true, 
      message: `Plugin ${req.params.id} disabled successfully` 
    });
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Failed to disable plugin: " + error.message 
    });
  }
});

app.post("/plugins/test", async (req, res) => {
  try {
    const { text, nama = "TestUser", session = "test" } = req.body;
    
    if (!text) {
      return res.json({ 
        status: false, 
        message: "Text message required" 
      });
    }
    
    const message = webAdapter.formatMessage({
      content: text,
      nama,
      session
    });
    
    const responses = await botCore.processMessage(message, 'web');
    
    res.json({ 
      status: true, 
      message: "Plugin processing completed",
      responses,
      available_commands: botCore.getAvailableCommands()
    });
    
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Plugin test failed: " + error.message 
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log("=====================================");
  console.log(`Bella aktif di http://${HOST}:${PORT}`);
  console.log("=====================================");
});
