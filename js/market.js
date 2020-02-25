const electron = require("electron")
const path = require("path")
const url = require("url")

const remote = electron.remote
const ipc = electron.ipcRenderer

let marketObj = 'jjj'

ipc.on('marketType', (event, args) => {
    marketType = args[0]
    marketData = args[1]
    
    document.getElementById('marketType').innerHTML = marketType
    if(marketData !== "") {
        marketData.forEach(e => {
            document.getElementById('marketForm').elements[e['name']].value = e['value']
        });
    }else {
        console.log('create new obj')
        // todo: add default value
    }
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    ipc.send('marketObj', [marketType, $('form').serializeArray()])
    remote.getCurrentWindow().close()
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close()
})


