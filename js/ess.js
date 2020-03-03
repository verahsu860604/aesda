const electron = require("electron");
const path = require("path");
const url = require("url");

const remote = electron.remote;
const ipc = electron.ipcRenderer;

const defaultVal = {
    'Power Flow Battery': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 40,
        'ei-cost': 470,
        'ei-inEffi': 0.78,
        'ei-outEffi': 0.78,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 0,
        'ei-maxsoc': 40,
        // 'ei-p1c': ,
        // 'ei-p1d': ,
        // 'ei-p2c': ,
        // 'ei-p2d': ,
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
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 0,
        'ei-maxsoc': 20,
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
    }, 'Supercapacitor': {
        'ei-numOfEss': 1,
        // 'ei-selfDischareRatio': ,
        // 'ei-dimen': ,
        // 'ei-cost': ,
        // 'ei-inEffi': ,
        // 'ei-outEffi': ,
        // 'ei-maxpin': ,
        // 'ei-maxpout': ,
        // 'ei-minsoc': ,
        // 'ei-maxsoc': ,
        // 'ei-p1c': ,
        // 'ei-p1d': ,
        // 'ei-p2c': ,
        // 'ei-p2d': ,
        // 'ei-p3c': ,
        // 'ei-p3d': ,
        // 'ei-p4c': ,
        // 'ei-p4d': ,
        // 'ei-p5c': ,
        // 'ei-p5d': ,
        // 'ei-p6c': ,
        // 'ei-p6d': ,
    }, 'Custom': {
        'ei-numOfEss': 1,
        // 'ei-selfDischareRatio': ,
        // 'ei-dimen': ,
        // 'ei-cost': ,
        // 'ei-inEffi': ,
        // 'ei-outEffi': ,
        // 'ei-maxpin': ,
        // 'ei-maxpout': ,
        // 'ei-minsoc': ,
        // 'ei-maxsoc': ,
        // 'ei-p1c': ,
        // 'ei-p1d': ,
        // 'ei-p2c': ,
        // 'ei-p2d': ,
        // 'ei-p3c': ,
        // 'ei-p3d': ,
        // 'ei-p4c': ,
        // 'ei-p4d': ,
        // 'ei-p5c': ,
        // 'ei-p5d': ,
        // 'ei-p6c': ,
        // 'ei-p6d': ,
    }
}

ipc.on('essType', (event, args) => {
    essType = args[0];
    essId = args[1]
    essData = args[2]
    document.getElementById('essType').innerHTML = essType + "-" + essId
    if(essData !== '') {
        essData.forEach(e => {
            document.getElementById('essForm').elements[e['name']].value = e['value']
        });
    }else {
        // todo: add default value
        setDefault(defaultVal[essType])
    }
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    ipc.send('essObj', [essType, essId, $('form').serializeArray()]);
    remote.getCurrentWindow().close();
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