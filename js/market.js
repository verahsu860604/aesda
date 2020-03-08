const electron = require("electron")
const path = require("path")
const url = require("url")

const remote = electron.remote
const ipc = electron.ipcRenderer

// To be modified
const defaultVal = {
    'Primary Reserve': {
        'mi-upItv': 1,
        'mi-dwnItv': 1,
        'mi-spUpdate': 1,
        'mi-twDelivery': 1,
        'mi-upMinPrice': 1,
        'mi-upMaxPrice': 1,
        'mi-dwnMinPrice': 1,
        'mi-dwnMaxPrice': 1,
        'mi-planning': 1,
        'mi-schedule': 1,
        'mi-selection': 1,
        'mi-delivery': 1,
        'mi-upPenalty': 1,
        'mi-dwnPenalty': 1
    }, 'Secondary Reserve': {
        'mi-upItv': 2,
        'mi-dwnItv': 2,
        'mi-spUpdate': 1,
        'mi-twDelivery': 1,
        'mi-upMinPrice': 1,
        'mi-upMaxPrice': 1,
        'mi-dwnMinPrice': 1,
        'mi-dwnMaxPrice': 1,
        'mi-planning': 1,
        'mi-schedule': 1,
        'mi-selection': 1,
        'mi-delivery': 1,
        'mi-upPenalty': 1,
        'mi-dwnPenalty': 1
    }, 'Tertiary Reserve': {
        'mi-upItv': 3,
        'mi-dwnItv': 3,
        'mi-spUpdate': 1,
        'mi-twDelivery': 1,
        'mi-upMinPrice': 1,
        'mi-upMaxPrice': 1,
        'mi-dwnMinPrice': 1,
        'mi-dwnMaxPrice': 1,
        'mi-planning': 1,
        'mi-schedule': 1,
        'mi-selection': 1,
        'mi-delivery': 1,
        'mi-upPenalty': 1,
        'mi-dwnPenalty': 1
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


