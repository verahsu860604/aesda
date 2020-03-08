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
var data;
ipc.on('datapoint', (event, args) => {
    data = args;
    console.log(data);
    document.getElementById('irr').innerHTML = "IRR: " + data['x']
    document.getElementById('profit').innerHTML = "Profit: " + data['profit']
    // document.getElementById('marketType').innerHTML = marketType
    // if(marketData !== "") {
    //     marketData.forEach(e => {
    //         document.getElementById('marketForm').elements[e['name']].value = e['value']
    //     });
    // }else {
    //     // todo: add default value
    //     setDefault(defaultVal[marketType])
    // }
})


document.querySelector("#downloadBtn").addEventListener('click', function() {
    console.log(document.getElementById('irr').defaultValue);
    document.getElementById('irr').value = data['x']
    console.log(data);
    ipc.send("download", data)
})

document.querySelector("#compareBtn").addEventListener('click', function() {
    ipc.send("compareData", data)
    remote.getCurrentWindow().close()
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
})