const electron = require("electron")
const path = require("path")
const url = require("url")

const remote = electron.remote
const ipc = electron.ipcRenderer

const defaultVal = {
    'Power Flow Battery': {
        'di-irr': 1,
        'di-prp': 1,
        'di-profit': 1,
        'di-batteryLife': 1
    }
}

ipc.on('marketType', (event, args) => {
    marketType = args[0]
    marketData = args[1]
    
    document.getElementById('marketType').innerHTML = marketType
    if(marketData !== "") {
        marketData.forEach(e => {
            document.getElementById('marketForm').elements[e['name']].value = e['value']
        });
    }else {
        // todo: add default value
        setDefault(defaultVal[marketType])
    }
})


document.querySelector("#downloadBtn").addEventListener('click', function() {
    if(curEss !== undefined) ipc.send("download", [curEss, essObjNum])
})

document.querySelector("#compareBtn").addEventListener('click', function() {
    if(curEss !== undefined) ipc.send("createDataElement", [curEss, essObjNum])
})



