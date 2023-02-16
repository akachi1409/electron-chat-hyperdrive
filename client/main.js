/* eslint-disable no-undef */

require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
// const Hypercore = require("hypercore");
const Hyperswarm = require("hyperswarm");
const Hyperdrive = require('hyperdrive')
const Corestore = require('corestore')
const b4a = require("b4a");
const goodbye = require("graceful-goodbye");

const conns = [];

goodbye(() => swarm.destroy());

const createHyperdrive = async () => {
  const store = new Corestore('./storage');
  
  const swarm = new Hyperswarm();
  goodbye(()=> swarm.destroy())

  swarm.on('connection', conn => {
    store.replicate(conn)
    const name = b4a.toString(conn.remotePublicKey, "hex");
    console.log("*Got Connection:", name, "*");
    conns.push(conn);
  });
  const drive = new Hyperdrive(store, b4a.from (process.env.KEY, 'hex'))

  await drive.ready();

  
  var oldMessage = [];
  for await (const entry of drive.entries()) {
    console.log (entry.key);
    if (entry.key == "/MessageBox"){
      const rs = drive.createReadStream(entry.key);
      var message ="";
      rs.on('data', (chunk) => {  message += chunk})
      rs.on('end', ()=> { 
        oldMessage = message.split("&&&");
        oldMessage.forEach(element => {
          if (element != "") 
            window.webContents.send("message:send", "YOU", element);
        });
      })
    }
  }

  drive.core.on('append', async function (){
    console.log("data")
    for await (const entry of drive.entries()) {
      if (entry.key == "/MessageBox"){
        const rs = drive.createReadStream(entry.key);
        var message ="";
        rs.on('data', (chunk) => { message += chunk})
        rs.on('end', ()=> { 
          var newMessage = message.split("&&&");
          var length = oldMessage.length;
          for ( var i = length; i < newMessage.length ; i++){
            if (newMessage[i] != "")
              window.webContents.send("message:send", "YOU", newMessage[i]);
          }
        })
      }
    }
  })
  const foundPeers = store.findingPeers();

  swarm.join(drive.discoveryKey, {client: true, server: false});
  swarm.flush().then(()=> foundPeers())
  
  const window = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname) + "/middleware/preload.js",
    },
  });
  
  ipcMain.on("message:send", async (event, message) => {
    console.log("message", message);
    for (const conn of conns) {
      conn.write("data" +  message);
    }
  });

  window.loadFile(path.join(__dirname) + "/pages/index.html");
};

app.whenReady().then(async () => {
  createHyperdrive();
});
