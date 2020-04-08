const electron = require("electron");
const {dialog} = require('electron').remote;
const path = require("path");
const url = require("url");

const remote = electron.remote;
const ipc = electron.ipcRenderer;

const strMap = require("../js/string.js")

const defaultVal = {
    'Power Flow Battery': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 40,
        'ei-cost': 470,
        'ei-othercost': 0,
        'ei-inEffi': 0.78,
        'ei-outEffi': 0.78,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 30,
        'ei-maxsoc': 70,
        'ei-p1c': 10,
        'ei-p1d': 0,
        'ei-p2c': 10,
        'ei-p2d': 10,
        // 'ei-p3c': ,
        // 'ei-p3d': ,
        // 'ei-p4c': ,
        // 'ei-p4d': ,
        // 'ei-p5c': ,
        // 'ei-p5d': ,
        // 'ei-p6c': ,
        // 'ei-p6d': ,
    }, 'Lithium-Ion': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 20,
        'ei-cost': 310,
        'ei-othercost': 0, 
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 0,
        'ei-maxsoc': 100,
        'ei-p1c': 10000000,
        'ei-p1d': 2,
        'ei-p2c': 1000000,
        'ei-p2d': 4,
        'ei-p3c': 100000,
        'ei-p3d': 17,
        'ei-p4c': 40000,
        'ei-p4d': 30,
        'ei-p5c': 10000,
        'ei-p5d': 60,
        'ei-p6c': 3000,
        'ei-p6d': 100,
    }, 'Supercapacitor': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 2,
        'ei-cost': 3100,
        'ei-othercost': 0,
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 0,
        'ei-maxsoc': 100,
        'ei-p1c': 10,
        'ei-p1d': 0,
        'ei-p2c': 10,
        'ei-p2d': 10,
//        'ei-p3c': 0,
//        'ei-p3d': 0,
//        'ei-p4c': 0,
//        'ei-p4d': 0,
//        'ei-p5c': 0,
//        'ei-p5d': 0,
//        'ei-p6c': 0,
//        'ei-p6d': 0,
    }, 'Custom': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 20,
        'ei-cost': 310,
        'ei-othercost': 0, 
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 30,
        'ei-maxsoc': 70,
        'ei-p1c': 546875,
        'ei-p1d': 7,
        'ei-p2c': 56000,
        'ei-p2d': 24,
        'ei-p3c': 14000,
        'ei-p3d': 49,
        'ei-p4c': 9406,
        'ei-p4d': 60,
        'ei-p5c': 5334,
        'ei-p5d': 80,
        'ei-p6c': 3571,
        'ei-p6d': 98,
    }
}

var dodprofile;
var socprofile;

var dimen_input = document.getElementsByName('ei-dimen')[0]
var minsoc_input = document.getElementsByName('ei-minsoc')[0]
var maxsoc_input = document.getElementsByName('ei-maxsoc')[0]
var max_power_input = document.getElementsByName('ei-maxpin')[0]
var max_power_output = document.getElementsByName('ei-maxpout')[0]

var soc_x_data = [0, 0, 0, 0];
var soc_y_data_charge = [0, 0, 0, undefined];
var soc_y_data_discharge = [undefined, 0, 0, 0];

var dodData = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]

ipc.on('essType', (event, args) => {
    essType = args[0];
    essId = args[1]
    essData = args[2]
    
    document.getElementById('essType').innerHTML = essType + "-" + essId

    if (essData !== '') {
        essData.forEach(e => {
            document.getElementById('essForm').elements[e['name']].value = e['value']
        });
    } else {
        setDefault(defaultVal[essType])
    }

    generageDodChart()
    generageSocChart()
    updateSocProfile()

    document.querySelectorAll('#dodInput input').forEach(e => {
        e.addEventListener('input', updateDodProfile)
        var i = e.name[4]
        var c = (e.name[5] === 'c') ? 'y' : 'x'
        dodData[i - 1][c] = parseInt(e.value)
        dodprofile.data.datasets[0].data = dodData
        dodprofile.update()

        if(essType === "Power Flow Battery" && i > 2) {
            e.disabled = true
        }
    })

    dimen_input.addEventListener('input', () => {
        updateSocProfile()
    })
    maxsoc_input.addEventListener('input', () => {
        updateSocProfile()
    })
    minsoc_input.addEventListener('input', () => {
        updateSocProfile()
    })
    max_power_input.addEventListener('input', () => {
        updateSocProfile()
    })
    max_power_output.addEventListener('input', () => {
        updateSocProfile()
    })
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    missing = formValidation()
    if(missing.length === 0) {
        ipc.send('submitEssObj', [essType, essId, $('form').serializeArray(), socprofile, dodprofile]);
        remote.getCurrentWindow().close();
    }else {
        dialog.showErrorBox('Please fill all the input boxes!', 'Missing fields: ' + missing.toString())
    }  
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
})

function setDefault(val) {
    var keys = Object.keys(val)
    keys.forEach(e => {
        document.getElementsByName(e)[0].defaultValue = val[e]
    })
}

function generageSocChart() {
    socprofile = new Chart(document.getElementById('socprofile'), {
        type: 'line',
        data: {
            labels: soc_x_data,
            datasets: [{
                label: "Charge",
                data: soc_y_data_charge,
                borderColor: "#3e95cd",
                fill: false,
                lineTension: 0
            },
            {
                label: "Discharge",
                data: soc_y_data_discharge,
                borderColor: "#8e5ea2",
                fill: false,
                lineTension: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'SoC Profile'
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Power Input/Output'
                    },
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Energy Stored'
                    },
                }]
            }
        }
    })
}

function generageDodChart() {
    dodprofile = new Chart(document.getElementById('dodprofile'), {
        type: 'scatter',
        data: {
            datasets: [{
                label: "DoD",
                data: dodData,
                showLine: true
            }]
        },
        options: {
            title: {
                display: true,
                text: 'DoD Profile'
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of Cycles'
                    },
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Deep of Discharge'
                    },
                }]
            }
        }
    })
}

function updateSocProfile() {
    soc_x_data[1] = parseInt(dimen_input.value) * (parseInt(minsoc_input.value) / 100.0)
    soc_x_data[2] = parseInt(dimen_input.value) * (parseInt(maxsoc_input.value) / 100.0)
    soc_x_data[3] = parseInt(dimen_input.value)
    soc_y_data_charge[1] = parseInt(max_power_input.value)
    soc_y_data_charge[2] = parseInt(max_power_input.value)
    soc_y_data_discharge[1] = parseInt(max_power_output.value)
    soc_y_data_discharge[2] = parseInt(max_power_output.value)
    socprofile.data.labels = soc_x_data
    socprofile.data.datasets[0].data = soc_y_data_charge
    socprofile.data.datasets[1].data = soc_y_data_discharge
    socprofile.update()
}

const updateDodProfile = function (e) {
    var i = e.target.name[4]
    var c = (e.target.name[5] === 'c') ? 'y' : 'x'
    dodData[i - 1][c] = parseInt(e.target.value)
    // dodData.sort((a, b) => a.x - b.x)
    dodprofile.data.datasets[0].data = dodData
    dodprofile.update()
}


function formValidation() {
    var inputs = document.getElementsByTagName('input')
    var missing = []
    for (let input of inputs) {
        if(input.value === null || input.value === "" && input.disabled === false) {
            missing.push(strMap.eiStrMap(input.name))
        }
    }
    return missing
}