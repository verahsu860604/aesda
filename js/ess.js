const electron = require("electron");
const path = require("path");
const url = require("url");

const remote = electron.remote;
const ipc = electron.ipcRenderer;

let essObj = 'jjj';
let essType;

ipc.on('essType', (event, args) => {
    essType = args;
    document.getElementById('essType').innerHTML = essType;
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    ipc.send('essObj', [essType, essObj]);
    remote.getCurrentWindow().close();
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
})