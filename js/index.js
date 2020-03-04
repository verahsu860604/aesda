const electron = require("electron")
const path = require("path")
const url = require("url")
const strMap = require("../js/string.js")

const {BrowserWindow} = electron.remote
const ipc = electron.ipcRenderer

let marketObjList = {}
// number of ess objects
let essObjNum = {'Power Flow Battery': 0, 'Lithium-Ion': 0, 'Supercapacitor': 0, 'Custom': 0}
let essObjList = {'Power Flow Battery': {}, 'Lithium-Ion': {}, 'Supercapacitor': {}, 'Custom': {}}

const barColor = {
  'mi-planning': 'bg-warning',
  'mi-schedule': 'bg-success',
  'mi-selection': 'bg-info',
  'mi-delivery': 'bg-danger',
}

// Dropdown control


var curMarket
var marketDropdownItem = document.querySelectorAll("#market .dropdown-item")
var marketDropdownMenu = document.querySelector("#market #dropdownMenuLink")

marketDropdownItem.forEach((node) => {
    node.addEventListener('click', function(e){
        curMarket = e['toElement']['text']
        marketDropdownMenu.innerHTML = curMarket
    })
}) 

function toggleMarketItem(marketType) {
  marketDropdownItem.forEach(e => {
    if(e.text === marketType){
      if(e.style.display === "none")e.style.display = "block"
      else e.style.display = "none"
    }
  })
}

var curEss
var essDropdownItem = document.querySelectorAll("#ess .dropdown-item")
var essDropdownMenu = document.querySelector("#ess #dropdownMenuLink")

essDropdownItem.forEach((node) => {
    node.addEventListener('click', function(e){
        curEss = e['toElement']['text']
        essDropdownMenu.innerHTML = curEss
    })
}) 

function clearDropdownMenu(type) {
  switch(type) {
    case 'market':
      marketDropdownMenu.innerHTML = "Select Reserve"    
      break;
    case 'ess':
      essDropdownMenu.innerHTML = 'Select Storage'
      break;
    default:
  }
}

// buttons control
document.querySelector("#marketBtn").addEventListener('click', function() {
    if(curMarket !== undefined) ipc.send("createMarketWindow", curMarket)
})

document.querySelector("#essBtn").addEventListener('click', function() {
    if(curEss !== undefined) ipc.send("createEssWindow", [curEss, essObjNum])
})

// switch control
// var p = document.getElementById('paretoSwitch').checked
// var f = document.getElementById('fileSwitch').checked

// ipc
ipc.on('marketObj', (event, args) => {
    var marketType = args[0]
    var marketData = args[1]
    
    if(marketType in marketObjList) {
        marketObjList[marketType] = marketData
        editMarketElem(marketType, marketData)
    }else {
        marketObjList[marketType] = marketData
        createMarketElem(args) 
        clearDropdownMenu('market')
        toggleMarketItem(marketType)
    }
})

ipc.on('essObj', (event, args) => {
    var essType = args[0]
    var essId = args[1]
    var essData = args[2]
    if(essObjNum[essType] >= essId) {
        essObjList[essType][essId] = essData
        editEssElement(essType, essId, essData)
    } else {
        essId = essObjNum[essType] + 1
        essObjNum[essType] = essId    
        essObjList[essType][essId] = essData
        createEssElem([essType, essId, essData])
        clearDropdownMenu('ess')
    }
    
})

ipc.on('generateResult', (event, args) => {
    document.querySelector('#result .alert').style.display = "none"
    generateResultChart()
}) 

// functions
function createMarketElem(args) {
    
    var marketType = args[0]
    var marketData = args[1]

    var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'id=marketEditBtn')
    editbtn.innerHTML = 'Edit'
    var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
    deletebtn.innerHTML = 'Delete'

    var cardBody = createElement('div', 'class=card-body')
    var cardHead = createElement('H5', 'class=card-header')
    var cardHeadText = document.createTextNode(marketType)
    cardHead.appendChild(cardHeadText)

    var card = createElement('div', 'class=card mb-3', 'id='+marketType)

    var bodyContent1 = createElement('div', 'class=row', 'id=cardbody1')
    var bodyContent2 = createElement('div', 'class=progress m-2', 'style=height: 40px', 'id=cardbody2')

    var i = 0
    var totalPeriod = 0

    while(i < marketData.length) {
      if(i !== 8) var pSec = createElement('div', 'class=col-md-4')
      for(var j = 0; j < 4 && i < marketData.length; j++){
        if(8 <= i && i <= 11) {
          totalPeriod += parseInt(marketData[i]['value'])
        } else {
          var p = createElement('p', 'class=mb-1')
          p.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']
          pSec.appendChild(p)
        }
        i++
      }
      bodyContent1.appendChild(pSec)
    }

    for(i = 8; i < 12; i++) {
      var percentage = (marketData[i]['value'] / totalPeriod) * 100
      var pbar = createElement('div', 'class=progress-bar '+barColor[marketData[i]['name']], 'style=width:' + percentage + '%', 'role=progressbar', 'aria-valuenow='+(marketData[i]['value'] / totalPeriod) * 100, 'aria-valuemin=0',  'aria-valuemax=100')
      pbar.innerHTML = strMap.miStrMap(marketData[i]['name']).split(' ')[0] + ": " + marketData[i]['value'] 
      bodyContent2.appendChild(pbar)
    }

    cardBody.appendChild(bodyContent1)
    cardBody.appendChild(bodyContent2)

    cardBody.appendChild(editbtn)
    cardBody.appendChild(deletebtn)
    card.appendChild(cardHead)
    card.appendChild(cardBody)
    document.getElementById('markets').appendChild(card)

    editbtn.addEventListener('click', function(e) {
        ipc.send('editMarketObj', [marketType, marketObjList[marketType]])
    })

    deletebtn.addEventListener('click', function(e) {
        toggleMarketItem(marketType)
        delete marketObjList[marketType]
        card.remove()
    })   
}

function editMarketElem(marketType, marketData) {
    
    var body1 = document.getElementById('cardbody1')
    var body2 = document.getElementById('cardbody2')

    var i = 0
    var pObject = body1.querySelectorAll('p')
    
    pObject.forEach(e => {
      if(i === 8) i = 12
      e.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']  
      i++
    })

    var i = 0
    var barElem = body2.querySelectorAll('.progress-bar')
    var totalPeriod = 0
    
    for(var j = 8; j < 12; j++) {
      totalPeriod += parseInt(marketData[j]['value'])
    } 

    for(var j = 8; j < 12; j++) {
      var percentage = (marketData[j]['value'] / totalPeriod) * 100
      barElem[i].style.width = percentage+'%'
      barElem[i].innerHTML = strMap.miStrMap(marketData[j]['name']).split(' ')[0] + ": " + marketData[j]['value'] 
      i++
    }

}

function createEssElem(args) {

    var essType = args[0]
    var essId = args[1]
    var essData = args[2]

    var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'essEditBtn')
    editbtn.innerHTML = 'Edit'
    var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
    deletebtn.innerHTML = 'Delete'
    
    var cardBody = createElement('div', 'class=card-body')
    var cardHead = createElement('H5', 'class=card-header')
    var cardHeadText = document.createTextNode(essType + "-" + essId)
    cardHead.appendChild(cardHeadText)

    var card = createElement('div', 'class=card mb-3', 'id='+essType+"-"+essId)
    var cardiv = createElement('div', 'class=col-sm-4')
   
    for(var i = 0; i < 10; i++) {
        var p = createElement('p', 'class=mb-1')
        p.innerHTML = strMap.eiStrMap(essData[i]['name']) + ": " + essData[i]['value']
        cardBody.appendChild(p)
    }

    var essdisplay = document.getElementById('esss')
    if(essdisplay.childElementCount === 0 || (essdisplay.lastElementChild !== null && essdisplay.lastElementChild.childElementCount === 3)){
        var row = createElement('div', 'class=row')
        essdisplay.appendChild(row)   
    }

    cardBody.appendChild(editbtn)
    cardBody.appendChild(deletebtn)
    card.appendChild(cardHead)
    card.appendChild(cardBody)
    cardiv.appendChild(card)
    essdisplay.lastElementChild.appendChild(cardiv)

    editbtn.addEventListener('click', function(e) {
        ipc.send('editEsstObj', [essType, essId, essObjList[essType][essId]])
    })

    deletebtn.addEventListener('click', function(e) {
        delete essObjList[essType][essId]
        cardiv.remove()
    }) 

}

function editEssElement(essType, essId, essData) {
    var cardObject = document.getElementById(essType+"-"+essId)
    var pObject = cardObject.querySelectorAll('p')
    for(var i = 0; i < 10; i++) {
      pObject[i].innerHTML = strMap.eiStrMap(essData[i]['name']) + ": " + essData[i]['value']
    }
}

function createElement(type, ...args) {
    var ele = document.createElement(type)
    for(var i = 0; i < args.length; i++) {
        var kv = args[i].split('=')
        ele.setAttribute(kv[0], kv[1])
    }
    return ele
}

function generateResultChart() {
  window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(231,233,237)'
  };
  
  var config = {
    data: {
      datasets: [{
        label: 'Inferior Datapoints',
        borderColor: window.chartColors.red,
        borderWidth: 2,
        fill: false,
        data: [ { x: 0.778, y: 0.686} ,
          { x: 0.238, y: 0.548} ,
          { x: 0.824, y: 0.138} ,
          { x: 0.966, y: 0.099} ,
          { x: 0.453, y: 0.152} ,
          { x: 0.609, y: 0.926} ,
          { x: 0.776, y: 0.680} ,
          { x: 0.642, y: 0.238} ,
          { x: 0.722, y: 0.569} ,
          { x: 0.035, y: 0.557} ,
          { x: 0.298, y: 0.073} ,
          { x: 0.059, y: 0.840} ,
          { x: 0.857, y: 0.405} ,
          { x: 0.373, y: 0.145} ,
          { x: 0.680, y: 0.191} ,
          { x: 0.256, y: 0.491} ,
          { x: 0.348, y: 0.712} ,
          { x: 0.358, y: 0.875} ,
          { x: 0.218, y: 0.107} ,
          { x: 0.319, y: 0.913} ,
          { x: 0.918, y: 0.365} ,
          { x: 0.032, y: 0.227} ,
          { x: 0.065, y: 0.872} ,
          { x: 0.630, y: 0.136} ,
          { x: 0.874, y: 0.236} ,
          { x: 0.009, y: 0.595} ,
          { x: 0.747, y: 0.564} ,
          { x: 0.076, y: 0.453} ,
          { x: 0.656, y: 0.129} ,
          { x: 0.509, y: 0.761} ,
          { x: 0.480, y: 0.202} ,
          { x: 0.956, y: 0.176} ,
          { x: 0.000, y: 0.437} ,
          { x: 0.247, y: 0.340} ,
          { x: 0.325, y: 0.143} ,
          { x: 0.277, y: 0.845} ,
          { x: 0.695, y: 0.669} ,
          { x: 0.919, y: 0.109} ,
          { x: 0.244, y: 0.088} ,
          { x: 0.253, y: 0.194} ,
          { x: 0.379, y: 0.082} ,
          { x: 0.605, y: 0.269} ,
          { x: 0.772, y: 0.650} ,
          { x: 0.068, y: 0.547} ]
      },{
        label: 'Pareto Frontier',
        cubicInterpolationMode: 'monotone',
        borderColor: window.chartColors.blue,
        borderWidth: 2,
        fill: false,
        data: [ 
          { x: 0.009, y: 0.985, r: 1},    
          { x: 0.712, y: 0.967, r: 1},
          { x: 0.813, y: 0.959, r: 1},
          { x: 0.949, y: 0.499, r: 1},
          { x: 0.973, y: 0.246, r: 1} 
        ],
        borderWidth: 2.5,
        tension: 1,
        showLine: true
      }]
    },
    options: {
      responsive: true,
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
              var prp = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['r']
              return [['SoH: ' + data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['x']],
              ['Profit: ' + data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['y']],
              ['PRP: ' + (prp?prp:0)]];
          }
        },
        bodyFontSize: 14,
        displayColors: false          
      },
     hover: {
        mode: 'nearest',
        intersect: true
      },
      title: {
        display: true,
        text: 'Pareto Scatter Chart'
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'State of Health'
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Profit'
          }
        }]
      }
    }
  };
  
  var ctx = document.getElementById("paretoChart").getContext("2d");
  var pareto = Chart.Scatter(ctx, config);


}

