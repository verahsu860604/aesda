const electron = require("electron");
const path = require("path");
const url = require("url");

const remote = electron.remote;
const ipc = electron.ipcRenderer;

const defaultVal = {
    'Power Flow Battery': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 1,
        'ei-dimen': 1,
        'ei-cost': 1,
        'ei-inEffi': 1,
        'ei-outEffi': 1,
        'ei-maxpin': 1,
        'ei-maxpout': 1,
        'ei-minsoc': 1,
        'ei-maxsoc': 1,
        'ei-p1c': 1,
        'ei-p1d': 1,
        'ei-p2c': 1,
        'ei-p2d': 1,
        'ei-p3c': 1,
        'ei-p3d': 1,
        'ei-p4c': 1,
        'ei-p4d': 1,
        'ei-p5c': 1,
        'ei-p5d': 1,
        'ei-p6c': 1,
        'ei-p6d': 1,
    }, 'Lithium-Ion': {
        'ei-numOfEss': 2,
        'ei-selfDischareRatio': 1,
        'ei-dimen': 1,
        'ei-cost': 1,
        'ei-inEffi': 1,
        'ei-outEffi': 1,
        'ei-maxpin': 1,
        'ei-maxpout': 1,
        'ei-minsoc': 1,
        'ei-maxsoc': 1,
        'ei-p1c': 1,
        'ei-p1d': 1,
        'ei-p2c': 1,
        'ei-p2d': 1,
        'ei-p3c': 1,
        'ei-p3d': 1,
        'ei-p4c': 1,
        'ei-p4d': 1,
        'ei-p5c': 1,
        'ei-p5d': 1,
        'ei-p6c': 1,
        'ei-p6d': 1,
    }, 'Supercapacitor': {
        'ei-numOfEss': 3,
        'ei-selfDischareRatio': 1,
        'ei-dimen': 1,
        'ei-cost': 1,
        'ei-inEffi': 1,
        'ei-outEffi': 1,
        'ei-maxpin': 1,
        'ei-maxpout': 1,
        'ei-minsoc': 1,
        'ei-maxsoc': 1,
        'ei-p1c': 1,
        'ei-p1d': 1,
        'ei-p2c': 1,
        'ei-p2d': 1,
        'ei-p3c': 1,
        'ei-p3d': 1,
        'ei-p4c': 1,
        'ei-p4d': 1,
        'ei-p5c': 1,
        'ei-p5d': 1,
        'ei-p6c': 1,
        'ei-p6d': 1,
    }, 'Custom': {
        'ei-numOfEss': 4,
        'ei-selfDischareRatio': 1,
        'ei-dimen': 1,
        'ei-cost': 1,
        'ei-inEffi': 1,
        'ei-outEffi': 1,
        'ei-maxpin': 1,
        'ei-maxpout': 1,
        'ei-minsoc': 1,
        'ei-maxsoc': 1,
        'ei-p1c': 1,
        'ei-p1d': 1,
        'ei-p2c': 1,
        'ei-p2d': 1,
        'ei-p3c': 1,
        'ei-p3d': 1,
        'ei-p4c': 1,
        'ei-p4d': 1,
        'ei-p5c': 1,
        'ei-p5d': 1,
        'ei-p6c': 1,
        'ei-p6d': 1,
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