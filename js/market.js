const electron = require("electron")
const path = require("path")
const url = require("url")

const remote = electron.remote
const ipc = electron.ipcRenderer

// To be modified
const defaultVal = {
    'Primary Reserve': {
        'mi-upItv': 1, // missing
        'mi-dwnItv': 1, // missing
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 0,
        'mi-upMaxPrice': 10,
        'mi-dwnMinPrice': 0,
        'mi-dwnMaxPrice': 100,
        'mi-planning': 20,
        'mi-schedule': 20,
        'mi-selection': 20,
        'mi-delivery': 20,
        'mi-upPenalty': 1, // missing
        'mi-dwnPenalty': 1 // missing
    }, 'Secondary Reserve': {
        'mi-upItv': 1, // missing
        'mi-dwnItv': 1, // missing
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 0,
        'mi-upMaxPrice': 10,
        'mi-dwnMinPrice': 0,
        'mi-dwnMaxPrice': 100,
        'mi-planning': 20,
        'mi-schedule': 20,
        'mi-selection': 20,
        'mi-delivery': 20,
        'mi-upPenalty': 1, // missing
        'mi-dwnPenalty': 1 // missing
    }, 'Tertiary Reserve': {
        'mi-upItv': 1, // missing
        'mi-dwnItv': 1, // missing
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 0,
        'mi-upMaxPrice': 10,
        'mi-dwnMinPrice': 0,
        'mi-dwnMaxPrice': 100,
        'mi-planning': 20,
        'mi-schedule': 20,
        'mi-selection': 20,
        'mi-delivery': 20,
        'mi-upPenalty': 1, // missing
        'mi-dwnPenalty': 1 // missing
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
        setDefault(defaultVal[marketType])
    }
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    ipc.send('submitMarketObj', [marketType, $('form').serializeArray()])
    remote.getCurrentWindow().close()
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close()
})

function setDefault(val) {
    var keys = Object.keys(val)
    keys.forEach(e => {
        document.getElementsByName(e)[0].defaultValue = val[e]
    })
}
