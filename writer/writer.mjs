import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import Hyperdrive from 'hyperdrive';
import b4a from 'b4a'
import {v4 as uuidv4} from "uuid"
const corestore = new Corestore("./storage")
const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

await corestore.ready();
swarm.on('connection', conn => {
    corestore.replicate(conn);
    conn.on('data', async function (data){
        var message = data.toString();
        if (message.substring(0,4) === "data"){
            var oldMessage = await drive.get("MessageBox");
            oldMessage == null ? oldMessage = "": oldMessage = oldMessage.toString();
            console.log("oldMessage", oldMessage);
            const ws = drive.createWriteStream('MessageBox', {flags: "a"})
            ws.write(oldMessage+ "&&&");
            ws.write(message.substring(4) + "&&&");
            ws.end();
        }
    })
});
const drive = new Hyperdrive(corestore);
await drive.ready();

const discovery = swarm.join(drive.discoveryKey);
await discovery.flushed();

console.log("drive key:", b4a.toString(drive.key, 'hex'))
// console.log((await drive.get("MessageBox")).toString())

process.stdin.on('data',async (data)=>{
    // const ws = drive.createWriteStream('MessageBox', {flags: "a"})
    // ws.write(oldMessage)
    // ws.write(data);
    // ws.end();
    await drive.put(uuidv4(), data)
    // drive.put('MessageBox', data)
})