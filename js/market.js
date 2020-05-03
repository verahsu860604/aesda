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
        'mi-upMinPrice': 1,
        'mi-upMaxPrice': 20,
        'mi-dwnMinPrice': 150,
        'mi-dwnMaxPrice': 250,
        'mi-max_feasible_power_percentage' : 40,
        'mi-min_feasible_power_percentage' : 0,
        'mi-price_cyclic_n_upward'         : 2,
        'mi-price_cyclic_n_downward'       : 2,
        'mi-percentage_cyclic_n'           : 2,
        'mi-price_cyclic_eps_upward'       : 16, 
        'mi-price_cyclic_eps_downward'     : 80,
        'mi-percentage_cyclic_eps'         : 5,
        'mi-planning': 60,
        'mi-schedule': 60,
        'mi-selection': 60,
        'mi-delivery': 60,
        'mi-upPenalty': 1, // missing
        'mi-dwnPenalty': 1 // missing
    }, 'Secondary Reserve': {
        'mi-spUpdate': 1,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 5,
        'mi-upMaxPrice': 30,
        'mi-dwnMinPrice': 100,
        'mi-dwnMaxPrice': 400,
        'mi-max_feasible_power_percentage' : 80,
        'mi-min_feasible_power_percentage' : 20,
        'mi-price_cyclic_n_upward'         : 4,
        'mi-price_cyclic_n_downward'       : 5,
        'mi-percentage_cyclic_n'           : 1,
        'mi-price_cyclic_eps_upward'       : 25, 
        'mi-price_cyclic_eps_downward'     : 300,
        'mi-percentage_cyclic_eps'         : 60,
        'mi-planning': 0,
        'mi-schedule': 60,
        'mi-selection': 0,
        'mi-delivery': 240,
        'mi-upPenalty': 30, // missing
        'mi-dwnPenalty': 400 // missing
    }, 'Tertiary Reserve': {
        'mi-spUpdate': 15,
        'mi-twDelivery': 4,
        'mi-upMinPrice': 5,
        'mi-upMaxPrice': 30,
        'mi-dwnMinPrice': 100,
        'mi-dwnMaxPrice': 400,
        'mi-max_feasible_power_percentage' : 80,
        'mi-min_feasible_power_percentage' : 20,
        'mi-price_cyclic_n_upward'         : 4,
        'mi-price_cyclic_n_downward'       : 5,
        'mi-percentage_cyclic_n'           : 1,
        'mi-price_cyclic_eps_upward'       : 25, 
        'mi-price_cyclic_eps_downward'     : 300,
        'mi-percentage_cyclic_eps'         : 60,
        'mi-planning': 0,
        'mi-schedule': 60,
        'mi-selection': 0,
        'mi-delivery': 240,
        'mi-upPenalty': 30, // missing
        'mi-dwnPenalty': 400 // missing
    }
}

$("#mi-market_percentage_fixed").change(function() {
    if($("#mi-market_percentage_fixed").is(":checked")){
        $("#mi-max_feasible_power_percentage").prop('readonly', false);
        $("#mi-min_feasible_power_percentage").prop('readonly', false);
        $("#mi-percentage_cyclic_n").prop('readonly', false);
        $("#mi-percentage_cyclic_eps").prop('readonly', false);
        // $("#mi-market_percentage_fixed").value=1;
    }
    else{
        $("#mi-max_feasible_power_percentage").prop('readonly', true);
        $("#mi-min_feasible_power_percentage").prop('readonly', true);
        $("#mi-percentage_cyclic_n").prop('readonly', true);
        $("#mi-percentage_cyclic_eps").prop('readonly', true);
        // $("#mi-market_percentage_fixed").value=0;
    }
});

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