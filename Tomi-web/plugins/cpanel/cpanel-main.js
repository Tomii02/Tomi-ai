/*═══════════════════════════════════════════════════════
 *  ⌬  YT NeoShiroko Labs
 *═══════════════════════════════════════════════════════
 *  🌐  Website     : https://www.neolabsofficial.my.id
 *  ⌨︎  Developer   : https://zass.cloud
 *  ▶︎  YouTube     : https://www.youtube.com/@zassci_desu
 *  ⚙︎  Panel Murah : pteroku-desu.zass.cloud
 *
 *  ⚠︎  Mohon untuk tidak menghapus watermark ini
 *═══════════════════ © 2025 Zass Desuta ─════════════════════
 */
const fs = require("fs");
let handler = async (
  m,
  { conn, text, args, command, usedPrefix, isOwner, isGroup },
) => {
  const eggid = 15;
  const location = 26;
  const prefix = usedPrefix;
  const tanggal = new Date();
  const akiraa = conn;
  const pler = JSON.parse(fs.readFileSync("./database/idgrup.json").toString());
  const jangan = pler.includes(m.chat);
  const pp = conn
    .profilePictureUrl(m.sender, "image")
    .catch((_) => "https://telegra.ph/file/1ecdb5a0aee62ef17d7fc.jpg");
  switch (command) {
    case "pannel":
      {
        m.reply(`*☁️ LIST PANNEL YANG TERSEDIA*
*• 1GB ✅*
*• 2GB ✅*
*• 3GB ✅*
*• 4GB ✅*
*• 5GB ✅*
*• 6GB ✅*
*• 7GB ✅*
*• 8GB ✅*`);
      }
      break;
    case "addgc":
      if (!isOwner) return m.reply(`Khusus Owner`);
      pler.push(m.chat);
      fs.writeFileSync("./database/idgrup.json", JSON.stringify(pler));
      m.reply(`*[ System notice ]* sucess add accesss`);
      break;
    case "delgc":
      if (!isOwner) return m.reply(`Khusus Owner`);
      var ini = pler.indexOf(m.chat);
      pler.splice(ini, 1);
      fs.writeFileSync("./database/idgrup.json", JSON.stringify(pler));
      m.reply(`*[ System notice ]* sucess delete access`);

      break;
    case "1gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let loc = "1";
        let memo = 1024;
        let cpu = 100;
        let disk = 10240;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 1GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "2gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 + 1024;
        let cpu = 100 + 100;
        let disk = 10240 + 1024;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 2GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "3gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 3;
        let cpu = 100 * 3;
        let disk = 10240 * 3;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 3GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "4gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 4;
        let cpu = 100 * 4;
        let disk = 10240 * 4;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 4GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "5gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 5;
        let cpu = 100 * 5;
        let disk = 10240 * 5;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 5GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "6gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 6;
        let cpu = 100 * 6;
        let disk = 10240 * 6;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 8GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "7gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 7;
        let cpu = 100 * 7;
        let disk = 10240 * 7;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 7GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "8gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 8;
        let cpu = 100 * 8;
        let disk = 10240 * 8;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 8GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "9gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 9;
        let cpu = 100 * 9;
        let disk = 10240 * 9;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 9GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "10gb":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 1024 * 10;
        let cpu = 100 * 10;
        let disk = 10240 * 10;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL 10GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "unli":
      {
        if (!jangan)
          return m.reply(
            "*[ System Notice ]* the group can't access this feature",
          );
        let t = text.split(",");
        if (t.length < 2)
          return m.reply(
            `*• Example :* ${usedPrefix + command} *[username, number]*`,
          );
        let username = t[0];
        let u = m.quoted
          ? m.quoted.sender
          : t[1]
            ? t[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            : m.mentionedJid[0];
        let name = username;
        let egg = "15";
        let loc = "1";
        let memo = 0;
        let cpu = 0;
        let disk = 0;
        let email = username + "@zass.id";
        if (!u) return;
        let d = (await akiraa.onWhatsApp(u.split`@`[0]))[0] || {};
        let password = d.exists ? Func.makeId(8) : t[3];
        let f = await fetch(domain + "/api/application/users", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            email: email,
            username: username,
            first_name: username,
            last_name: username,
            language: "en",
            password: password.toString(),
          }),
        });
        let data = await f.json();
        if (data.errors)
          return m.reply(JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;
        let f2 = await fetch(
          domain + "/api/application/nests/6/eggs/" + eggid,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          },
        );
        let { key } = await akiraa.sendMessage(
          m.chat,
          {
            text: "*[ CREATING SERVER.... ]*",
          },
          {
            quoted: m,
          },
        );
        ctf = `*[ 📦 BERIKUT DATA PANNEL ANDA ]*
*• Username :* ${user.username}
*• Password :* ${password.toString()}
*• Login :* ${domain}
-------------------------------------------------------------------------------------
*🔴 Jangan Hilangkan Data Panel anda, Simpan history chat ini sebagai bukti claim garansi jika server mati/down*`;
        akiraa.sendButton(
          u,
          [["DONE ✓", `done ${u.split("@")[0]}| PANEL UNLI GB`]],
          null,
          {
            body: ctf,
            footer: "\nClick Button Done jika sudah login yah (⁠ ⁠╹⁠▽⁠╹⁠ ⁠)",
          },
        );
        let data2 = await f2.json();
        let startup_cmd = data2.attributes.startup;

        let f3 = await fetch(domain + "/api/application/servers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
          body: JSON.stringify({
            name: "🟢 " + name + " Server",
            description: `© Terimakasih telah order di ${nameowner}`,
            user: user.id,
            egg: parseInt(eggid),
            docker_image: data2.attributes.docker_image,
            startup: startup_cmd,
            environment: {
              INST: "npm",
              USER_UPLOAD: 0,
              AUTO_UPDATE: 0,
              CMD_RUN: "npm start",
            },
            limits: {
              memory: memo,
              swap: 0,
              disk: disk,
              io: 500,
              cpu: cpu,
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 5,
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: [],
            },
          }),
        });
        let res = await f3.json();
        if (res.errors) return m.reply(JSON.stringify(res.errors[0], null, 2));
        let server = res.attributes;
        let p = `*[ SUCCESS CREATING SERVER ]*
*• User ID :* ${user.id}
*• Server ID :* ${server.id}
*• Detail Users :* 
\`\`\`${Func.jsonFormat(user)}\`\`\`
*• Detail Server :* 
\`\`\`${Func.jsonFormat(server)}\`\`\`

*© 🇮🇩 BS STORE 2023 - 2024*`;
        await conn.sendMessage(
          m.chat,
          {
            text: p,
            edit: key,
          },
          {
            quoted: m,
          },
        );
      }
      break;
    case "listusr":
      {
        let txt = text ? text : 1;
        let f = await fetch(domain + "/api/application/users?page=" + txt, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apikey,
          },
        });
        let user = await f.json();
        let array = [];
        for (let i of user.data) {
          array.push({
            headers: "👤 USERNAME : " + i.attributes.username,
            rows: [
              {
                headers: "Detail Username",
                title: `View Detail user from [ ${i.attributes.username} ]`,
                body: i.attributes.uuid,
                command: ".detusr " + i.attributes.id,
              },
            ],
          });
        }
        akiraa.sendList(m.chat, "Click Here", array, m, {
          body: `Total User Panel today : *[ ${user.data.length} ]*`,
        });
      }
      break;
    case "detusr":
      {
        if (!text) throw `*• Example :* ${usedPrefix + command} *[id user]*`;
        let f = await (
          await fetch(domain + "/api/application/users/" + text, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + apikey,
            },
          })
        ).json();

        let user = f.attributes;
        let cap = `*[ DETAIL USER  ${user.id} ]*
*• Email :* ${user.email}
*• Username :* ${user.username}
*• Uuid :* ${user.uuid}
*• admin panel :* ${user.root_admin ? "yes" : "no"}`;
        conn.sendButton(
          m.chat,
          [
            ["DELETE USER", `.delusr ${user.id}`],
            ["BACK TO MENU", ".menu"],
          ],
          m,
          {
            footer: cap,
          },
        );
      }
      break;
  }
};
handler.command = handler.help = [
  "sh",
  "pannel",
  "addgc",
  "delgc",
  "1gb",
  "2gb",
  "3gb",
  "4gb",
  "5gb",
  "6gb",
  "7gb",
  "8gb",
  "9gb",
  "10gb",
  "unli",
  "listusr",
  "detusr",
];
handler.tags = ["cpanel"];
module.exports = handler;
