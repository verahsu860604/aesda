const electron = require("electron");
const path = require("path");
const url = require("url");

const remote = electron.remote;
const ipc = electron.ipcRenderer;

let marketObj = 'jjj'
let marketType;

ipc.on('marketType', (event, args) => {
    marketType = args;
    document.getElementById('marketType').innerHTML = marketType;
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    ipc.send('marketObj', [marketType, marketObj]);
    remote.getCurrentWindow().close();
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
})