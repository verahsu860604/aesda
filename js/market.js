const electron = require("electron")
const {dialog} = require('electron').remote;
const path = require("path")
const url = require("url")

const remote = electron.remote
const ipc = electron.ipcRenderer

const strMap = require("../js/string.js")

// To be modified
const defaultVal = {
    'Primary Reserve': {
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 0,
        'mi-upMaxPrice': 10,
        'mi-dwnMinPrice': 0,
        'mi-dwnMaxPrice': 100,
        'mi-max_feasible_power_percentage' : 40,
        'mi-min_feasible_power_percentage' : 0,
        'mi-price_cyclic_n_upward'         : 2,
        'mi-price_cyclic_n_downward'       : 2,
        'mi-percentage_cyclic_n'           : 2,
        'mi-price_cyclic_eps_upward'       : 5, 
        'mi-price_cyclic_eps_downward'     : 5,
        'mi-percentage_cyclic_eps'         : 5,
        'mi-planning': 20,
        'mi-schedule': 20,
        'mi-selection': 20,
        'mi-delivery': 20,
        'mi-upPenalty': 1, // missing
        'mi-dwnPenalty': 1 // missing
    }, 'Secondary Reserve': {
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 0,
        'mi-upMaxPrice': 10,
        'mi-dwnMinPrice': 0,
        'mi-dwnMaxPrice': 100,
        'mi-max_feasible_power_percentage' : 20,
        'mi-min_feasible_power_percentage' : 0,
        'mi-price_cyclic_n_upward'         : 2,
        'mi-price_cyclic_n_downward'       : 2,
        'mi-percentage_cyclic_n'           : 2,
        'mi-price_cyclic_eps_upward'       : 5, 
        'mi-price_cyclic_eps_downward'     : 5,
        'mi-percentage_cyclic_eps'         : 5,
        'mi-planning': 20,
        'mi-schedule': 20,
        'mi-selection': 20,
        'mi-delivery': 20,
        'mi-upPenalty': 1, // missing
        'mi-dwnPenalty': 1 // missing
    }, 'Tertiary Reserve': {
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 0,
        'mi-upMaxPrice': 10,
        'mi-dwnMinPrice': 0,
        'mi-dwnMaxPrice': 100,
        'mi-max_feasible_power_percentage' : 20,
        'mi-min_feasible_power_percentage' : 0,
        'mi-price_cyclic_n_upward'         : 2,
        'mi-price_cyclic_n_downward'       : 2,
        'mi-percentage_cyclic_n'           : 2,
        'mi-price_cyclic_eps_upward'       : 5, 
        'mi-price_cyclic_eps_downward'     : 5,
        'mi-percentage_cyclic_eps'         : 5,
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
    missing = formValidation()
    if(missing.length === 0) {
        ipc.send('submitMarketObj', [marketType, $('form').serializeArray()])
        remote.getCurrentWindow().close()
    }else {
        dialog.showErrorBox('Please fill all the inputs!', 'Missing fields: ' + missing.toString())
    }
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

function formValidation() {
    var inputs = document.getElementsByTagName('input')
    var missing = []
    for (let input of inputs) {
        if(input.value === null || input.value === "") {
            missing.push(strMap.miStrMap(input.name))
        }
    }
    return missing
}