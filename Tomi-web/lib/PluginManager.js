const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.pluginsDir = path.join(__dirname, '..', 'plugins');
    this.indexFile = path.join(this.pluginsDir, 'index.json');
    this.ajv = new Ajv();
    
    // Schema untuk validasi manifest.json
    this.manifestSchema = {
      type: "object",
      required: ["id", "name", "version", "description"],
      properties: {
        id: { type: "string", pattern: "^[a-z0-9_-]+$" },
        name: { type: "string", minLength: 1 },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        author: { type: "string" },
        description: { type: "string", minLength: 1 },
        tags: { type: "array", items: { type: "string" } },
        permissions: { type: "array", items: { type: "string" } },
        capabilities: {
          type: "object",
          properties: {
            commands: { type: "array", items: { type: "string" } },
            events: { type: "array", items: { type: "string" } },
            tools: { type: "array", items: { type: "string" } }
          }
        },
        triggers: {
          type: "object",
          properties: {
            commands: { type: "array", items: { type: "string" } },
            patterns: { type: "array", items: { type: "string" } }
          }
        },
        intent_examples: { type: "array", items: { type: "string" } },
        config_schema: { type: "object" },
        dependencies: { type: "array", items: { type: "string" } },
        maturity: { type: "string", enum: ["stable", "beta", "alpha", "experimental"] },
        enabled: { type: "boolean", default: false }
      }
    };
    
    this.validateManifest = this.ajv.compile(this.manifestSchema);
    this.ensurePluginsDir();
  }

  ensurePluginsDir() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
    if (!fs.existsSync(this.indexFile)) {
      fs.writeFileSync(this.indexFile, JSON.stringify({
        plugins: [],
        lastScan: null,
        version: "1.0.0"
      }, null, 2));
    }
  }

  async scanPlugins() {
    console.log('🔍 Scanning plugins...');
    const plugins = [];
    
    try {
      await this.scanDirectory(this.pluginsDir, plugins);
      
      // Update index.json
      const index = {
        plugins: plugins.map(p => ({
          id: p.manifest.id,
          name: p.manifest.name,
          version: p.manifest.version,
          enabled: p.manifest.enabled || false,
          path: p.path,
          type: p.type
        })),
        lastScan: new Date().toISOString(),
        version: "1.0.0"
      };
      
      fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
      
      console.log(`✅ Found ${plugins.length} plugins`);
      return plugins;
      
    } catch (error) {
      console.error('❌ Error scanning plugins:', error);
      return [];
    }
  }

  async scanDirectory(directory, plugins) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'index.json') continue;
      
      const fullPath = path.join(directory, entry.name);
      
      try {
        if (entry.isDirectory()) {
          // Check jika folder ini adalah plugin (ada manifest.json + index.js)
          const manifestPath = path.join(fullPath, 'manifest.json');
          const indexPath = path.join(fullPath, 'index.js');
          
          if (fs.existsSync(manifestPath) && fs.existsSync(indexPath)) {
            // Ini plugin folder, load dan jangan recurse lebih dalam
            const plugin = await this.loadFolderPlugin(fullPath, manifestPath, indexPath);
            if (plugin) plugins.push(plugin);
          } else {
            // Bukan plugin, recurse ke dalam folder
            await this.scanDirectory(fullPath, plugins);
          }
        } else if (entry.name.endsWith('.js')) {
          // Plugin single file dengan front-matter
          const plugin = await this.loadSingleFilePlugin(fullPath);
          if (plugin) plugins.push(plugin);
        }
      } catch (error) {
        console.error(`❌ Error processing ${entry.name}:`, error.message);
      }
    }
  }

  async loadFolderPlugin(pluginPath, manifestPath, indexPath) {
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (!this.validateManifest(manifestData)) {
        throw new Error(`Invalid manifest: ${JSON.stringify(this.validateManifest.errors)}`);
      }
      
      // Load README.md jika ada
      const readmePath = path.join(pluginPath, 'README.md');
      const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
      
      return {
        manifest: manifestData,
        path: path.relative(this.pluginsDir, pluginPath),
        type: 'folder',
        indexFile: indexPath,
        readme: readme,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error loading folder plugin ${pluginPath}:`, error.message);
      return null;
    }
  }

  async loadSingleFilePlugin(pluginPath) {
    try {
      const content = fs.readFileSync(pluginPath, 'utf8');
      
      // Try front-matter format first
      const frontMatterMatch = content.match(/^\/\*\s*({[\s\S]*?})\s*\*\//);
      
      if (frontMatterMatch) {
        const manifestData = JSON.parse(frontMatterMatch[1]);
        
        if (!this.validateManifest(manifestData)) {
          throw new Error(`Invalid manifest: ${JSON.stringify(this.validateManifest.errors)}`);
        }
        
        return {
          manifest: manifestData,
          path: path.relative(this.pluginsDir, pluginPath),
          type: 'single',
          indexFile: pluginPath,
          readme: '',
          loadedAt: new Date().toISOString()
        };
      }
      
      // Try legacy handler format
      const manifestData = this.parseLegacyPlugin(content, pluginPath);
      if (manifestData) {
        return {
          manifest: manifestData,
          path: path.relative(this.pluginsDir, pluginPath),
          type: 'legacy',
          indexFile: pluginPath,
          readme: '',
          loadedAt: new Date().toISOString()
        };
      }
      
      throw new Error('No valid plugin format found');
      
    } catch (error) {
      console.error(`❌ Error loading single file plugin ${path.basename(pluginPath)}:`, error.message);
      return null;
    }
  }

  parseLegacyPlugin(content, pluginPath) {
    try {
      // Extract plugin metadata from handler properties
      const fileName = path.basename(pluginPath, '.js');
      const folderName = path.basename(path.dirname(pluginPath));
      
      // Generate manifest from file structure and content
      const manifest = {
        id: fileName.replace(/[^a-z0-9_-]/gi, '_'),
        name: this.generatePluginName(fileName),
        version: "1.0.0",
        author: "Legacy Plugin",
        description: this.generatePluginDescription(fileName, folderName),
        tags: [folderName],
        permissions: [],
        capabilities: {
          commands: this.extractCommands(content),
          events: [],
          tools: []
        },
        triggers: {
          commands: this.extractCommands(content),
          patterns: []
        },
        intent_examples: this.extractCommands(content),
        maturity: "stable",
        enabled: true
      };
      
      return manifest;
    } catch (error) {
      console.error(`Error parsing legacy plugin ${pluginPath}:`, error.message);
      return null;
    }
  }

  generatePluginName(fileName) {
    return fileName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/^(Rpg|Group|Download|Sticker|Store|Tools|Owner|Premium|Info|Game|Fun|Anime|Ai)\s*/i, '');
  }

  generatePluginDescription(fileName, folderName) {
    const descriptions = {
      downloader: 'Download content from various platforms',
      group: 'Group management and moderation tools', 
      rpg: 'RPG game features and commands',
      sticker: 'Sticker creation and management',
      tools: 'Utility tools and helpers',
      owner: 'Bot owner exclusive commands',
      premium: 'Premium user features',
      store: 'Store and payment features',
      info: 'Information and data retrieval',
      game: 'Entertainment games and activities',
      fun: 'Fun and entertainment commands',
      anime: 'Anime related content and features',
      ai: 'AI and chatbot features'
    };
    
    return descriptions[folderName] || `${folderName} plugin - ${fileName}`;
  }

  extractCommands(content) {
    const commands = [];
    
    // Extract from handler.command
    const commandMatch = content.match(/handler\.command\s*=\s*(.+)/);
    if (commandMatch) {
      const commandValue = commandMatch[1];
      
      if (commandValue.includes('/^') && commandValue.includes('$/')) {
        // Regex format: /^(tt|tiktok)$/i
        const regexMatch = commandValue.match(/\/\^(?:\()?([^$)]+)(?:\))?\$/);
        if (regexMatch) {
          const cmdPattern = regexMatch[1];
          commands.push(...cmdPattern.split('|').map(cmd => cmd.trim()));
        }
      } else if (commandValue.includes('[') && commandValue.includes(']')) {
        // Array format: ["kick", "tendang"]
        const arrayMatch = commandValue.match(/\[([^\]]+)\]/);
        if (arrayMatch) {
          const cmdArray = arrayMatch[1].split(',').map(cmd => cmd.trim().replace(/['"]/g, ''));
          commands.push(...cmdArray);
        }
      }
    }
    
    // Extract from handler.help
    const helpMatch = content.match(/handler\.help\s*=\s*\[([^\]]+)\]/);
    if (helpMatch && commands.length === 0) {
      const helpCommands = helpMatch[1].split(',').map(cmd => {
        return cmd.trim().replace(/['"]/g, '').split(' ')[0].replace(/[<>]/g, '');
      });
      commands.push(...helpCommands);
    }
    
    return commands.filter(cmd => cmd && cmd.length > 0);
  }

  convertLegacyHandler(handler, manifest) {
    // Convert legacy handler to modern plugin format
    return {
      name: manifest.name,
      description: manifest.description,
      
      commands: {
        // Create commands mapping from manifest
        ...manifest.capabilities.commands.reduce((acc, cmd) => {
          acc[cmd] = async (ctx) => {
            // Convert modern context to legacy format
            const legacyM = this.createLegacyContext(ctx);
            const legacyConn = this.createLegacyConn(ctx);
            
            try {
              await handler(legacyM, { 
                conn: legacyConn,
                text: ctx.args.join(' '),
                usedPrefix: '.',
                command: cmd,
                args: ctx.args,
                isOwner: ctx.chat?.sender?.isAdmin || false,
                isAdmin: ctx.chat?.sender?.isAdmin || false,
                isPrems: false
              });
            } catch (error) {
              console.error(`Legacy handler error for ${cmd}:`, error);
              ctx.reply(`❌ Error executing ${cmd}: ${error.message}`);
            }
          };
          return acc;
        }, {})
      }
    };
  }

  createLegacyContext(ctx) {
    return {
      chat: ctx.chat?.chatId || 'default',
      sender: ctx.chat?.sender?.id || 'unknown',
      text: ctx.text || '',
      quoted: ctx.quotedMessage,
      mentionedJid: ctx.mentions || [],
      args: ctx.args || []
    };
  }

  createLegacyConn(ctx) {
    return {
      user: { jid: 'bot@whatsapp.net' },
      reply: (chatId, text, quoted) => ctx.reply(text),
      sendFile: (chatId, url, filename, caption, quoted) => {
        ctx.reply(caption || `📁 File: ${filename}`);
      },
      groupParticipantsUpdate: async (chatId, participants, action) => {
        if (action === 'remove' && ctx.removeParticipant) {
          for (const participant of participants) {
            await ctx.removeParticipant(participant);
          }
        }
      }
    };
  }

  async loadPlugin(pluginInfo) {
    try {
      // Clear require cache untuk hot-reload
      delete require.cache[require.resolve(pluginInfo.indexFile)];
      
      const pluginModule = require(pluginInfo.indexFile);
      let plugin = pluginModule.default || pluginModule;
      
      // Handle legacy handler format
      if (pluginInfo.type === 'legacy' && typeof plugin === 'function') {
        plugin = this.convertLegacyHandler(plugin, pluginInfo.manifest);
      }
      
      if (typeof plugin.setup === 'function') {
        await plugin.setup({
          logger: console,
          config: {},
          storage: {}
        });
      }
      
      this.plugins.set(pluginInfo.manifest.id, {
        ...pluginInfo,
        module: plugin,
        active: true
      });
      
      // Persist enabled state ke manifest file jika folder plugin
      if (pluginInfo.type === 'folder') {
        await this.persistEnabledState(pluginInfo.manifest.id, true);
      }
      
      console.log(`✅ Plugin loaded: ${pluginInfo.manifest.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Error loading plugin ${pluginInfo.manifest.id}:`, error.message);
      return false;
    }
  }

  async persistEnabledState(pluginId, enabled) {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || plugin.type !== 'folder') return;
      
      const manifestPath = path.join(this.pluginsDir, plugin.path, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.enabled = enabled;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        // Update in-memory state
        plugin.manifest.enabled = enabled;
      }
    } catch (error) {
      console.error(`❌ Error persisting enabled state for ${pluginId}:`, error);
    }
  }

  getPlugin(id) {
    return this.plugins.get(id);
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  // Method untuk get semua plugins yang di-scan (loaded + unloaded)
  getAllScannedPlugins() {
    try {
      const indexData = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
      return indexData.plugins || [];
    } catch (error) {
      console.error('Error reading plugin index:', error);
      return [];
    }
  }

  getEnabledPlugins() {
    return this.getAllPlugins().filter(p => p.manifest.enabled && p.active);
  }

  // Method untuk mencari plugin berdasarkan ID dari scan results (bukan hanya yang loaded)
  async findPluginById(id) {
    const plugins = await this.scanPlugins();
    return plugins.find(p => p.manifest.id === id);
  }

  // Catalog untuk AI consumption
  getCatalogForAI() {
    return this.getAllPlugins().map(plugin => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      description: plugin.manifest.description,
      capabilities: plugin.manifest.capabilities || {},
      triggers: plugin.manifest.triggers || {},
      intent_examples: plugin.manifest.intent_examples || [],
      tools: this.extractToolSchemas(plugin),
      commands: this.extractCommands(plugin),
      enabled: plugin.manifest.enabled || false,
      maturity: plugin.manifest.maturity || 'experimental'
    }));
  }

  extractToolSchemas(plugin) {
    if (!plugin.module || !plugin.module.tools) return [];
    
    return Object.entries(plugin.module.tools).map(([name, tool]) => ({
      name,
      description: tool.description || '',
      schema: tool.schema || {}
    }));
  }

  extractCommands(plugin) {
    if (!plugin.module || !plugin.module.commands) return [];
    
    return Object.keys(plugin.module.commands);
  }
}

module.exports = PluginManager;