// Web Adapter untuk integrasi dengan Bella chat

class WebAdapter {
  constructor() {
    this.name = 'web';
    this.platform = 'web';
  }

  // Convert web chat message ke format BotCore
  formatMessage(webMessage) {
    return {
      text: webMessage.content || webMessage.text,
      chatId: webMessage.session || 'web_default',
      channel: 'web',
      timestamp: Date.now(),
      sender: {
        id: webMessage.nama || 'web_user',
        name: webMessage.nama || 'Web User',
        isAdmin: false
      },
      mentions: this.extractMentions(webMessage.content),
      attachments: webMessage.photo ? [webMessage.photo] : []
    };
  }

  extractMentions(text) {
    if (!text) return [];
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  // Send message back to web chat
  async sendMessage(response, chatId) {
    // Untuk web adapter, response langsung dikembalikan
    // Implementasi real akan kirim via WebSocket atau HTTP response
    console.log(`📤 [Web] Sending to ${chatId}:`, response.text);
    return response;
  }

  async sendMedia(media, chatId) {
    console.log(`📸 [Web] Sending media to ${chatId}:`, media);
    return media;
  }

  // Group operations (tidak applicable untuk web)
  async removeParticipant(chatId, userId) {
    return { 
      success: false, 
      error: 'Group operations not supported in web chat' 
    };
  }

  async getRoster(chatId) {
    return [{
      id: 'web_user',
      name: 'Web User',
      isAdmin: false
    }];
  }
}

module.exports = WebAdapter;