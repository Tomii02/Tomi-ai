// lib/BotCore.js
const PluginManager = require('./PluginManager');
const ai = require('./ai');

class BotCore {
  constructor() {
    this.pluginManager = new PluginManager();
    this.adapters = new Map();
    this.commandPrefix = '/';
    this.tools = new Map();
    this.initialized = false;
  }
  async initialize() {
    console.log('🤖 Initializing BotCore...');
    const plugins = await this.pluginManager.scanPlugins();
    for (const plugin of plugins) {
      if (plugin.manifest.enabled) {
        await this.pluginManager.loadPlugin(plugin);
        this.registerPluginTools(plugin);
      }
    }
    this.initialized = true;
    console.log('✅ BotCore initialized');
  }
  registerAdapter(name, adapter) {
    this.adapters.set(name, adapter);
    console.log(`🔌 Adapter registered: ${name}`);
  }
  registerPluginTools(plugin) {
    const pluginData = this.pluginManager.getPlugin(plugin.manifest.id);
    if (!pluginData || !pluginData.module || !pluginData.module.tools) return;
    Object.entries(pluginData.module.tools).forEach(([toolName, tool]) => {
      this.tools.set(toolName, {
        plugin: plugin.manifest.id,
        description: tool.description,
        schema: tool.schema,
        handler: tool.handler.bind(pluginData.module)
      });
      console.log(`🔧 Tool registered: ${toolName}`);
    });
  }
  async processMessage(message, adapter = 'web') {
    if (!this.initialized) {
      await this.initialize();
    }
    try {
      const context = this.createContext(message, adapter);
      if (message.text?.startsWith(this.commandPrefix)) {
        const handled = await this.handleCommand(context);
        if (handled) return context.responses;
      }
      const handled = await this.handleIntent(context);
      if (handled) return context.responses;
      return await this.handleFallback(context);
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return [{ text: "Maaf, terjadi error saat memproses pesan 😓", type: 'error' }];
    }
  }
  createContext(message, adapterName) {
    const adapter = this.adapters.get(adapterName);
    const context = {
      text: message.text || '',
      args: this.parseArgs(message.text),
      timestamp: message.timestamp || Date.now(),
      chat: {
        platform: adapterName,
        chatId: message.chatId || 'default',
        channel: message.channel || 'default',
        sender: {
          id: message.sender?.id || 'anonymous',
          name: message.sender?.name || 'User',
          isAdmin: message.sender?.isAdmin || false
        }
      },
      mentions: message.mentions || [],
      quotedMessage: message.quotedMessage || null,
      attachments: message.attachments || [],
      responses: [],
      reply: (text, type = 'text') => {
        const response = { text, type, timestamp: Date.now() };
        context.responses.push(response);
        if (adapter && adapter.sendMessage) {
          adapter.sendMessage(response, message.chatId);
        }
        return response;
      },
      sendMedia: (media) => {
        const response = { ...media, type: 'media', timestamp: Date.now() };
        context.responses.push(response);
        if (adapter && adapter.sendMedia) {
          adapter.sendMedia(response, message.chatId);
        }
        return response;
      },
      removeParticipant: async (userId) => {
        if (adapter && adapter.removeParticipant) {
          return await adapter.removeParticipant(message.chatId, userId);
        }
        return { success: false, error: 'Not supported in this platform' };
      },
      getRoster: async () => {
        if (adapter && adapter.getRoster) {
          return await adapter.getRoster(message.chatId);
        }
        return [];
      }
    };
    return context;
  }
  parseArgs(text) {
    if (!text) return [];
    const parts = text.trim().split(/\s+/);
    return parts.slice(1);
  }
  async handleCommand(context) {
    const command = context.text.split(/\s+/)[0];
    const enabledPlugins = this.pluginManager.getEnabledPlugins();
    for (const plugin of enabledPlugins) {
      if (plugin.module && plugin.module.commands && plugin.module.commands[command]) {
        try {
          console.log(`🎯 Executing command ${command} from plugin ${plugin.manifest.id}`);
          await plugin.module.commands[command](context);
          return true;
        } catch (error) {
          console.error(`❌ Error executing command ${command}:`, error);
          context.reply(`❌ Error executing command: ${error.message}`, 'error');
          return true;
        }
      }
    }
    return false;
  }
  async handleIntent(context) {
    const enabledPlugins = this.pluginManager.getEnabledPlugins();
    for (const plugin of enabledPlugins) {
      const patterns = plugin.manifest.triggers?.patterns || [];
      for (const pattern of patterns) {
        if (this.matchesPattern(context.text, pattern)) {
          const commands = Object.keys(plugin.module?.commands || {});
          if (commands.length > 0) {
            try {
              console.log(`🎯 Intent matched for plugin ${plugin.manifest.id}`);
              await plugin.module.commands[commands[0]](context);
              return true;
            } catch (error) {
              console.error(`❌ Error executing intent:`, error);
            }
          }
        }
      }
    }
    return false;
  }
  matchesPattern(text, pattern) {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    const keywords = patternLower.split(/\s+/);
    return keywords.some(keyword => textLower.includes(keyword.replace('@', '')));
  }
  
  // Perbaikan: Fungsi ini sekarang menerima pesan pengguna
  async handleFallback(context) {
    console.log('💬 Fallback to Bella AI');
    try {
      const availableTools = this.getAvailableTools();
      const userName = context.chat?.sender?.name || 'User';
      
      // Menggabungkan prompt Bella dengan pesan dari pengguna
      const promptUntukAI = `
        Kamu adalah Bella AI buatan Tomii. Kamu sedang mengobrol dengan "${userName}". Jawablah semua pertanyaan user dengan santai, singkat, dan jangan terlalu formal.

        ---
        Pesan User: ${context.text}
        ---
      `;
      
      const aiResponse = await ai.generateResponse(promptUntukAI, availableTools);
      
      context.reply(aiResponse);
      return context.responses;
    } catch (error) {
      console.error('❌ AI fallback error:', error);
      context.reply(`Maaf ${context.chat?.sender?.name || 'User'}, saya sedang mengalami gangguan. Mohon coba lagi nanti.`);
      return context.responses;
    }
  }
  getAvailableCommands() {
    const commands = [];
    const enabledPlugins = this.pluginManager.getEnabledPlugins();
    enabledPlugins.forEach(plugin => {
      if (plugin.module && plugin.module.commands) {
        commands.push(...Object.keys(plugin.module.commands));
      }
    });
    return commands;
  }
  getAvailableTools() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      schema: tool.schema,
      plugin: tool.plugin
    }));
  }
  async callTool(toolName, input, context) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    try {
      console.log(`🔧 Calling tool: ${toolName}`);
      return await tool.handler(context, input);
    } catch (error) {
      console.error(`❌ Error calling tool ${toolName}:`, error);
      throw error;
    }
  }
  async enablePlugin(pluginId) {
    let plugin = this.pluginManager.getPlugin(pluginId);
    if (!plugin) {
      const foundPlugin = await this.pluginManager.findPluginById(pluginId);
      if (!foundPlugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      plugin = foundPlugin;
    }
    plugin.manifest.enabled = true;
    plugin.active = true;
    await this.pluginManager.loadPlugin(plugin);
    this.registerPluginTools(plugin);
    await this.pluginManager.persistEnabledState(pluginId, true);
    console.log(`✅ Plugin enabled: ${pluginId}`);
    return true;
  }
  async disablePlugin(pluginId) {
    const plugin = this.pluginManager.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    plugin.manifest.enabled = false;
    plugin.active = false;
    await this.pluginManager.persistEnabledState(pluginId, false);
    this.tools.forEach((tool, toolName) => {
      if (tool.plugin === pluginId) {
        this.tools.delete(toolName);
      }
    });
    console.log(`❌ Plugin disabled: ${pluginId}`);
    return true;
  }
}

module.exports = BotCore;
