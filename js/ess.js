const electron = require("electron");
const path = require("path");
const url = require("url");

const remote = electron.remote;
const ipc = electron.ipcRenderer;

let essObj = 'jjj';

ipc.on('essType', (event, args) => {
    essType = args[0];
    essId = args[1]
    essData = args[2]

    document.getElementById('essType').innerHTML = essType
    if(essId == -1) {
        essData.forEach(e => {
            document.getElementById('essForm').elements[e['name']].value = e['value']
        });
    }else {
        console.log('create new obj')
        // todo: add default value
    }
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    ipc.send('essObj', [essType, essId, $('form').serializeArray()]);
    remote.getCurrentWindow().close();
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
})