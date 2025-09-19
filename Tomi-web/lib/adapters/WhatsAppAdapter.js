// lib/adapters/WhatsAppAdapter.js
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, getMedia, get } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class WhatsAppAdapter {
  constructor(botCore, db) {
    this.name = 'whatsapp';
    this.platform = 'whatsapp';
    this.botCore = botCore;
    this.db = db;
    this.sock = null;
    this.isConnected = false;
    this.authPath = path.join(__dirname, '..', '..', 'whatsapp_session');
    
    // Web Pairing State
    this.webPairingState = {
      status: 'disconnected',
      code: null,
      qr: null,
      phoneNumber: null
    };
  }
  
  // Metode baru untuk mendapatkan status pairing
  getPairingStatus() {
    return this.webPairingState;
  }
  
  // Metode baru untuk memulai pairing
  async startPairing({ phoneNumber, method }) {
    if (this.sock) {
      await this.disconnect();
    }
    
    this.webPairingState.phoneNumber = phoneNumber || null;
    this.webPairingState.qr = null;
    this.webPairingState.code = null;
    this.webPairingState.method = method; // Tambahkan metode pairing
    this.webPairingState.status = 'requesting';
    
    console.log(`🟡 Starting pairing via ${method} method...`);
    await this.connect();
  }
  
  async deleteSession() {
    if (this.isConnected) {
      await this.disconnect();
    }
    
    const sessionPath = path.join(__dirname, '..', '..', 'whatsapp_session');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('📁 WhatsApp session deleted');
    }
    
    this.webPairingState.status = 'disconnected';
    this.webPairingState.code = null;
    this.webPairingState.qr = null;
    this.webPairingState.phoneNumber = null;
  }
  
  async connect() {
    console.log('🟢 Connecting to WhatsApp...');
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
      this.sock = makeWASocket({
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        printQRInTerminal: false,
      });

      // Perbaikan: Logika pairing code dipindahkan ke sini
      if (this.webPairingState.method === 'code' && this.webPairingState.phoneNumber) {
        try {
          const code = await this.sock.requestPairingCode(this.webPairingState.phoneNumber);
          this.webPairingState.code = code;
          this.webPairingState.status = 'waiting';
          console.log(`🔑 Pairing code generated: ${code}`);
        } catch (err) {
          console.log('❌ Error requesting pairing code:', err.message);
          this.webPairingState.status = 'error';
        }
      }

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          this.webPairingState.qr = qr;
          this.webPairingState.status = 'waiting_qr';
        }
        if (connection === 'close') {
          this.isConnected = false;
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          if (this.sock) this.sock.ev.removeAllListeners();
          this.webPairingState.status = 'disconnected';
          if (shouldReconnect) {
            console.log('🔄 Reconnecting...');
            setTimeout(() => this.connect(), 30000);
          } else {
            console.log('🚫 Logged out. Delete session and restart for new pairing.');
            this.webPairingState.status = 'logged_out';
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.webPairingState.status = 'connected';
          this.webPairingState.code = null;
          this.webPairingState.qr = null;
          console.log('✅ WhatsApp connected successfully!');
          console.log(`📞 Bot number: ${this.sock.user.id.split(':')[0]}`);
          try {
            await this.sock.sendMessage(this.sock.user.id, { 
              text: '🤖 Bella AI Bot terhubung!\n\nKetik /ping untuk test atau /help untuk daftar command.' 
            });
          } catch (err) {
            console.log('Could not send welcome message:', err.message);
          }
        }
      });
      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('messages.upsert', async (m) => {
        for (const msg of m.messages) {
          if (msg.key.fromMe) {
            await this.saveMessageToDb(msg, 'outbound');
            continue;
          }
          await this.saveMessageToDb(msg, 'inbound');
          await this.handleMessage(msg);
        }
      });
    } catch (error) {
      console.error('❌ WhatsApp connection error:', error);
      this.webPairingState.status = 'error';
      setTimeout(() => this.connect(), 5000);
    }
  }

  async saveMessageToDb(msg, direction = 'inbound') {
    if (!msg.message) return;
    const chatId = msg.key.remoteJid;
    const isGroup = chatId.includes('@g.us');
    let senderName;
    if (direction === 'inbound') {
        const senderId = msg.key.participant || msg.key.remoteJid;
        senderName = msg.pushName || senderId.split('@')[0] || 'Unknown User';
        try {
            const contact = await this.sock.getContact(senderId);
            if (contact && (contact.name || contact.verifiedName)) {
                senderName = contact.name || contact.verifiedName;
            }
        } catch (e) {
            console.error('Could not get contact info:', e.message);
        }
    } else {
        senderName = 'Bot';
    }
    const msgType = Object.keys(msg.message)[0];
    let content = '';
    let attachments = [];
    if (msgType === 'conversation') {
        content = msg.message.conversation;
    } else if (msgType === 'imageMessage') {
        content = msg.message.imageMessage.caption || '';
    } else if (msgType === 'extendedTextMessage') {
        content = msg.message.extendedTextMessage.text;
    } else if (msgType === 'viewOnceMessageV2') {
        const viewOnce = msg.message.viewOnceMessageV2.message;
        if (viewOnce.imageMessage) {
            content = viewOnce.imageMessage.caption || '[FOTO VIEW ONCE]';
        } else if (viewOnce.videoMessage) {
            content = viewOnce.videoMessage.caption || '[VIDEO VIEW ONCE]';
        }
    } else {
        content = `[Pesan ${msgType}]`;
    }
    let chatName = this.db.data.chatHistory[chatId]?.name;
    if (!chatName) {
        if (isGroup) {
            try {
                const groupMetadata = await this.sock.groupMetadata(chatId);
                chatName = groupMetadata.subject;
            } catch (e) {
                chatName = 'Unknown Group';
            }
        } else {
            chatName = 'Pribadi: ' + senderName;
        }
    }
    if (!this.db.data.chatHistory[chatId]) {
      this.db.data.chatHistory[chatId] = { name: chatName, type: isGroup ? 'group' : 'private', history: [] };
    }
    this.db.data.chatHistory[chatId].history.push({
      sender: senderName,
      content: content,
      type: msgType,
      attachments: attachments,
      timestamp: msg.messageTimestamp * 1000
    });
    this.db.write();
  }

  async handleMessage(msg) {
    try {
      if (msg.key.fromMe) return; 
      let messageText = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || '';
      let attachments = [];
      let isViewOnce = false;
      if (msg.message?.viewOnceMessageV2) {
          isViewOnce = true;
          const viewOnce = msg.message.viewOnceMessageV2.message;
          let buffer;
          let mediaType;
          let fileName;
          if (viewOnce.imageMessage) {
              messageText = viewOnce.imageMessage.caption || '[FOTO VIEW ONCE]';
              mediaType = 'image';
              buffer = await getMedia(viewOnce.imageMessage, "buffer");
              fileName = `vonce-${uuidv4()}.jpeg`;
          } else if (viewOnce.videoMessage) {
              messageText = viewOnce.videoMessage.caption || '[VIDEO VIEW ONCE]';
              mediaType = 'video';
              buffer = await getMedia(viewOnce.videoMessage, "buffer");
              fileName = `vonce-${uuidv4()}.mp4`;
          }
          if (buffer) {
              const mediaDir = path.join(__dirname, '..', '..', 'media');
              if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
              const filePath = path.join(mediaDir, fileName);
              fs.writeFileSync(filePath, buffer);
              attachments.push({ url: `/media/${fileName}`, type: mediaType });
              console.log(`📸 Saved view once media: ${fileName}`);
          }
      }
      if (!messageText && attachments.length === 0) return;
      const chatId = msg.key.remoteJid;
      const senderId = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || senderId.split('@')[0];
      const isGroup = chatId.includes('@g.us');
      const formattedMessage = this.formatMessage({
        text: messageText,
        chatId,
        senderId,
        senderName,
        isGroup,
        attachments: attachments,
        timestamp: Date.now()
      });
      
      const responses = await this.botCore.processMessage(formattedMessage, 'whatsapp');
      
      // PERBAIKAN: Memastikan respons valid sebelum mencoba mengirim
      for (const response of responses) {
        if (response && (response.text || typeof response === 'string')) {
          await this.sendMessage({ text: response.text || response }, chatId);
        }
      }

    } catch (error) {
      console.error('❌ Error handling message:', error);
      // Kirim pesan error jika ada masalah
      this.sendMessage({ text: 'Maaf, terjadi error saat memproses pesan 😥' }, msg.key.remoteJid);
    }
  }

  formatMessage(waMessage) {
    return {
      text: waMessage.text,
      chatId: waMessage.chatId,
      channel: waMessage.isGroup ? 'group' : 'private',
      timestamp: waMessage.timestamp,
      sender: {
        id: waMessage.senderId,
        name: waMessage.senderName,
        isAdmin: false
      },
      attachments: waMessage.attachments || []
    };
  }

  async sendMessage(response, chatId) {
    if (!this.sock || !this.isConnected) {
      console.log('❌ WhatsApp not connected');
      return;
    }
    try {
      const message = { text: response.text || response.toString() };
      await this.sock.sendMessage(chatId, message);
      console.log(`📤 [WhatsApp] Sent to ${chatId}: ${message.text}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  async disconnect() {
    if (this.sock) {
      this.sock.ev.removeAllListeners();
      await this.sock.logout();
      this.sock = null;
      this.isConnected = false;
      this.webPairingState.status = 'disconnected';
      this.webPairingState.code = null;
      this.webPairingState.qr = null;
      this.webPairingState.phoneNumber = null;
      console.log('🔴 WhatsApp disconnected');
    }
  }
}

module.exports = WhatsAppAdapter;
