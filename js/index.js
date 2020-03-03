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



// Dropdown control
var curMarket
document.querySelectorAll("#market .dropdown-item").forEach((node) => {
    node.addEventListener('click', function(e){
        curMarket = e['toElement']['text']
        document.querySelector("#market #dropdownMenuLink").innerHTML = curMarket
    })
}) 

var curEss
document.querySelectorAll("#ess .dropdown-item").forEach((node) => {
    node.addEventListener('click', function(e){
        curEss = e['toElement']['text']
        document.querySelector("#ess #dropdownMenuLink").innerHTML = curEss
    })
}) 

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

    for(var i = 0; i < marketData.length; i++) {
        var p = createElement('p', 'class=mb-1')
        p.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']
        cardBody.appendChild(p)
    }

    cardBody.appendChild(editbtn)
    cardBody.appendChild(deletebtn)
    card.appendChild(cardHead)
    card.appendChild(cardBody)
    document.getElementById('markets').appendChild(card)

    editbtn.addEventListener('click', function(e) {
        ipc.send('editMarketObj', [marketType, marketObjList[marketType]])
    })

    deletebtn.addEventListener('click', function(e) {
        delete marketObjList[marketType]
        card.remove()
    })   
}

function editMarketElem(marketType, marketData) {
    var i = 0
    var cardObject = document.getElementById(marketType)
    var pObject = cardObject.querySelectorAll('p')
    marketData.forEach(e => {
        pObject[i++].innerHTML = strMap.miStrMap(e['name']) + ": " + e['value']
    })
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
    
    for(var i = 0; i < essData.length; i++) {
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
    var i = 0
    var cardObject = document.getElementById(essType+"-"+essId)
    var pObject = cardObject.querySelectorAll('p')
    essData.forEach(e => {
        pObject[i++].innerHTML = strMap.eiStrMap(e['name']) + ": " + e['value']
    })
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

// https://codepen.io/jordanwillis/pen/ZeaLGj?editors=1010
window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(231,233,237)'
  };
  
  var randomScalingFactor = function() {
    return (Math.random() > 0.5 ? 1.0 : 1.0) * Math.round(Math.random() * 10000);
  };
  
  var line1 = [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), ];
  var line2 = [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), ];
  var line3 = [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), ];
  
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var config = {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [{
        label: "Power Flow Batter-1",
        backgroundColor: window.chartColors.red,
        borderColor: window.chartColors.red,
        data: line1,
        fill: false,
      }, {
        label: "Power Flow Batter-2",
        fill: false,
        backgroundColor: window.chartColors.blue,
        borderColor: window.chartColors.blue,
        data: line2,
      }, {
        label: "Supercapacitor-1",
        fill: false,
        backgroundColor: window.chartColors.blue,
        borderColor: window.chartColors.orange,
        data: line3,
      }]
    },
    options: {
      responsive: true,
      title:{
        display:true,
        text:'Chart.js Line Chart'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
     hover: {
        mode: 'nearest',
        intersect: true
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Month'
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
          },
        }]
      }
    }
  };
  
  var ctx = document.getElementById("paretoChart").getContext("2d");
  var myLine = new Chart(ctx, config);

  new Chart(document.getElementById("storageChart"), {
    type: 'bar',
    data: {
      labels: ["1900", "1950", "1999", "2050"],
      datasets: [{
          label: "Europe",
          type: "line",
          borderColor: "#8e5ea2",
          data: [408,547,675,734],
          fill: false
        }, {
          label: "Africa",
          type: "line",
          borderColor: "#3e95cd",
          data: [133,221,783,2478],
          fill: false
        }, {
          label: "Europe",
          type: "bar",
          backgroundColor: "rgba(0,0,0,0.2)",
          data: [408,547,675,734],
        }, {
          label: "Africa",
          type: "bar",
          backgroundColor: "rgba(0,0,0,0.2)",
          backgroundColorHover: "#3e95cd",
          data: [133,221,783,2478]
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Population growth (millions): Europe & Africa'
      },
      legend: { display: false }
    }
});

}

