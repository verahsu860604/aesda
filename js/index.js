const electron = require("electron")
const path = require("path")
const url = require("url")
const strMap = require("../js/string.js")
const fs = require("fs")
const { dialog } = require('electron').remote;
const { BrowserWindow } = electron.remote
const ipc = electron.ipcRenderer
const { PythonShell } = require('python-shell')

// const XLSX = require('xlsx');
var timestamp

let marketObjList = {}
// number of ess objects
let essObjNum = { 'Power Flow Battery': 0, 'Lithium-Ion': 0, 'Supercapacitor': 0, 'Custom': 0 }
let essObjList = { 'Power Flow Battery': {}, 'Lithium-Ion': {}, 'Supercapacitor': {}, 'Custom': {} }
let marketDataList = {}

generateResultChart()
generateHorizonChart()
const barColor = {
  'mi-planning': 'bg-warning',
  'mi-schedule': 'bg-success',
  'mi-selection': 'bg-info',
  'mi-delivery': 'bg-danger',
}

// init config
const defaultVal = {
  'ci-predic': 60,
  'ci-totTimestampMonth': 1,
  'ci-totTimestampWeek': 0,
  'ci-totTimestampDay': 0,
  'ci-totTimestampHour': 0,
  'ci-sohItv': 3
}

Object.keys(defaultVal).forEach(e => {
  document.getElementsByName(e)[0].defaultValue = defaultVal[e]
})

// Dropdown control
var curMarket
var marketDropdownItem = document.querySelectorAll("#market .dropdown-item")
var marketDropdownMenu = document.querySelector("#market #dropdownMenuLink")

marketDropdownItem.forEach((node) => {
  node.addEventListener('click', function (e) {
    curMarket = e['toElement']['text']
    marketDropdownMenu.innerHTML = curMarket
  })
})

function toggleMarketItem(marketType) {
  marketDropdownItem.forEach(e => {
    if (e.text === marketType) {
      if (e.style.display === "none") e.style.display = "block"
      else e.style.display = "none"
    }
  })
}

var curEss
var essDropdownItem = document.querySelectorAll("#ess .dropdown-item")
var essDropdownMenu = document.querySelector("#ess #dropdownMenuLink")

essDropdownItem.forEach((node) => {
  node.addEventListener('click', function (e) {
    curEss = e['toElement']['text']
    essDropdownMenu.innerHTML = curEss
  })
})

function clearDropdownMenu(type) {
  switch (type) {
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
document.querySelector("#marketBtn").addEventListener('click', function () {
  if (curMarket !== undefined) ipc.send("createMarketWindow", curMarket)
})
document.querySelector("#essBtn").addEventListener('click', function () {
  if (curEss !== undefined) ipc.send("createEssWindow", [curEss, essObjNum])
})
document.querySelector("#resetIRRChartBtn").addEventListener('click', function () {
  irrParetoChart.resetZoom()
})
document.querySelector("#resetRevChartBtn").addEventListener('click', function () {
  revParetoChart.resetZoom()
})


// ipc
ipc.on('createMarketObj', (event, args) => {
  var marketType = args[0]
  var oldMarketData = args[1]
  var marketData = []
  var found = false

  for (i=0; i<oldMarketData.length;i++){
    if (oldMarketData[i]['name'] === "mi-market_percentage_fixed"){
      found = true
    }
    else {
      marketData.push(oldMarketData[i])
    }
  }
  marketData.push({
    'name': 'mi-market_percentage_fixed',
    'value': found === true ? "1" : "0"
  })
  let marketTypeDict = {
    'Primary Reserve': 0,
    'Secondary Reserve': 1,
    'Tertiary Reserve': 2,
  }
  marketData.push({
    'name': 'mi-name',
    'value': marketType
  })

  if (marketType in marketObjList) {
    marketObjList[marketType] = marketData
    editMarketElem(marketType, marketData)
  } else {
    marketObjList[marketType] = marketData
    updateFileSetting()
    createMarketElem(marketType, marketData)
    clearDropdownMenu('market')
    toggleMarketItem(marketType)
  }
  createTopology()
})

ipc.on('createEssObj', (event, args) => {
  var essType = args[0]
  var essId = args[1]
  var essData = args[2]
  console.log(essData)
  essData.push({
    'name': 'ei-name',
    'value': essType
  })
  var socprofile = args[3]
  var dodprofile = args[4]

  if (essObjNum[essType] >= essId) {
    essObjList[essType][essId] = essData
    editEssElement(essType, essId, essData, socprofile, dodprofile)
  } else {
    essId = essObjNum[essType] + 1
    essObjNum[essType] = essId
    essObjList[essType][essId] = essData
    createEssElem(essType, essId, essData, socprofile, dodprofile)
    clearDropdownMenu('ess')
  }

  createTopology()

})

var progressBar = document.querySelector('#progress .progress .progress-bar')
var progressHint = document.querySelector('#progress-hint')
progressBar.style = "width: 10%"

ipc.on('generateResult', (event, args) => {
  missing = formValidation()
  if (missing.length === 0) {
    progressBar.classList = "progress-bar progress-bar-striped progress-bar-animated"
    irrParetoChart.data.datasets[0].data = []
    irrParetoChart.data.datasets[1].data = []
    irrParetoChart.update()
    // irrParetoChart.resetZoom()
    revParetoChart.data.datasets[0].data = []
    revParetoChart.data.datasets[1].data = []
    revParetoChart.update()
    // revParetoChart.resetZoom()
    progressBar.style = "width: 0%"
    // convert timestamp to minute
    var configForm = $("form").serializeArray()
    console.log(configForm)
    let totTimestampMin = (((parseFloat(configForm[4].value) * 30) + (parseFloat(configForm[5].value) * 7) + parseFloat(configForm[6].value)) * 24 + parseFloat(configForm[7].value)) * 60
    for(let i = 4; i < 8; i++) configForm.pop()
    configForm.push({"name": "ci-totTimestamp", "value": totTimestampMin.toString()})
    // append files to market objects
    appendFilesToMarket()
    ipc.send('run', { configForm, marketObjList, essObjList })
    document.querySelector('#result .alert').style.display = "none"
    document.querySelector('#progress').style.display = ""
  } else {
    dialog.showErrorBox('Please fill all the inputs!', 'Missing fields: ' + missing.toString())
  }
})

function appendFilesToMarket() {
  for (let key in marketDataList) {
    let e = key.split('-')
    let filepath = (e[1] === 'setpoint') ? 'setpoint_data_path' : 'price_data_path'
    let market
    if (e[0] === 'primary') market = 'Primary Reserve'
    else if (e[0] === 'secondary') market = 'Secondary Reserve'
    else if (e[0] === 'tertiary') market = 'Tertiary Reserve'

    marketObjList[market].push({
      'name': filepath,
      'value': marketDataList[key]
    })
  }
}
ipc.on('startTime', (event, args) => {
  timestamp = Date.parse(args)
  progressHint.innerHTML = 'Simulating... <br />'
  console.log("timestamp: " + args)
  console.log("timestamp: " + timestamp)
})

previous_revenue = 0

ipc.on('updateProgressBar', (event, args) => {
  progressBar.style = "width: " + args[0] + "%"
  previous_revenue = args[1]['revenue']
  progressHint.innerHTML = 'Simulating ' + args[0].toFixed(3) + '% <br />' + 'Current Revenue (kEuro) = ' + (+args[1]['revenue'].toFixed(2))
  updateChartData(args[1])
})

ipc.on('updateProgressBarFast', (event, args) => {
  progressBar.style = "width: " + args[0] + "%"
  progressHint.innerHTML = 'Simulating ' + args[0].toFixed(3) + '% <br />' + 'Current Revenue (kEuro) = ' + (+previous_revenue.toFixed(2))
})

ipc.on('doneProgressBar', (event, args) => {
  progressBar.classList = "bg-success"
  progressHint.innerHTML = progressHint.innerHTML.replace('Simulating', 'Done!')
})

// functions
function createMarketElem(marketType, marketData) {
  var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'id=marketEditBtn')
  editbtn.innerHTML = 'Edit'
  var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
  deletebtn.innerHTML = 'Delete'

  var cardBody = createElement('div', 'class=card-body')
  var cardHead = createElement('H5', 'class=card-header')
  var cardHeadText = document.createTextNode(marketType)
  cardHead.appendChild(cardHeadText)

  var card = createElement('div', 'class=card mb-3', 'id=' + marketType)

  var bodyContent1 = createElement('div', 'class=row', 'id=cardbody1')
  var bodyContent2 = createElement('div', 'class=progress m-2', 'style=height: 30px', 'id=cardbody2')

  var i = 0
  var j = 0
  var totalPeriod = 0

  for (i = 0; i < 8; i++) {
    if (i % 4 === 0) var pSec = createElement('div', 'class=col-md-6')
    var p = createElement('p', 'class=mb-1')
    p.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']
    pSec.appendChild(p)
    if (i % 4 === 0) bodyContent1.appendChild(pSec)
  }

  for (i = 14; i < 18; i++) totalPeriod += parseInt(marketData[i]['value'])

  // while(i < marketData.length) {
  //   j = 0
  //   var pSec = createElement('div', 'class=col-md-4')
  //   while(j < 4) {
  //     if(i >= marketData.length) break
  //     if(8 <= i && i <= 13) {i++}
  //     if(14 <= i && i <= 17) {
  //       totalPeriod += parseInt(marketData[i]['value'])
  //       i++
  //     } else {
  //       var p = createElement('p', 'class=mb-1')
  //       p.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']
  //       pSec.appendChild(p)
  //       i++
  //       j++
  //     }
  //   }
  //   bodyContent1.appendChild(pSec)
  // }

  for (i = 14; i < 18; i++) {
    var percentage = (marketData[i]['value'] / totalPeriod) * 100
    var pbar = createElement('div', 'class=progress-bar ' + barColor[marketData[i]['name']], 'style=width:' + percentage + '%', 'role=progressbar', 'aria-valuenow=' + (marketData[i]['value'] / totalPeriod) * 100, 'aria-valuemin=0', 'aria-valuemax=100')
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

  editbtn.addEventListener('click', function (e) {
    ipc.send('editMarketObj', [marketType, marketObjList[marketType]])
  })

  deletebtn.addEventListener('click', function (e) {
    toggleMarketItem(marketType)
    delete marketObjList[marketType]
    updateFileSetting()
    card.remove()
    createTopology()
  })
}

function editMarketElem(marketType, marketData) {

  var body1 = document.getElementById('cardbody1')
  var body2 = document.getElementById('cardbody2')

  var i = 0
  var pObject = body1.querySelectorAll('p')

  pObject.forEach(e => {
    e.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']
    i++
  })

  var i = 0
  var barElem = body2.querySelectorAll('.progress-bar')
  var totalPeriod = 0

  for (var j = 14; j < 18; j++) {
    totalPeriod += parseInt(marketData[j]['value'])
  }

  for (var j = 14; j < 18; j++) {
    var percentage = (marketData[j]['value'] / totalPeriod) * 100
    barElem[i].style.width = percentage + '%'
    barElem[i].innerHTML = strMap.miStrMap(marketData[j]['name']).split(' ')[0] + ": " + marketData[j]['value']
    i++
  }

}

function createEssElem(essType, essId, essData, socprofile, dodprofile) {

  essTypeId = essType.replace(/\s+/g, "")

  var btndiv = createElement('div', 'class=ml-3 mt-1 mb-1')
  var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'essEditBtn')
  editbtn.innerHTML = 'Edit'
  var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
  deletebtn.innerHTML = 'Delete'

  btndiv.appendChild(editbtn)
  btndiv.appendChild(deletebtn)

  var cardBody = createElement('div', 'class=card-body row collapse', 'id=body' + essTypeId + "-" + essId, 'aria-labelledby=' + essTypeId + "-" + essId, 'data-parent=#head' + essTypeId + "-" + essId)
  var cardHeadBtn = createElement('button', 'class=btn btn-link collapsed p-0', 'data-toggle=collapse', 'data-target=#body' + essTypeId + "-" + essId, 'aria-expanded=false', 'aria-controls=' + essTypeId + "-" + essId)
  cardHeadBtn.innerHTML = essType + "-" + essId + " (Quantity: " + essData[0]['value'] + ")"
  var cardHead = createElement('H5', 'class=card-header', 'id=head' + essTypeId + "-" + essId)
  cardHead.appendChild(cardHeadBtn)

  var card = createElement('div', 'class=card mb-3', 'id=' + essTypeId + "-" + essId)
  var cardiv = createElement('div', 'class=col-md-12')

  var cardtext = createElement('div', 'class=col-md-4')
  for (var i = 1; i < 8; i++) {
    var p = createElement('p', 'class=mb-1')
    p.innerHTML = strMap.eiStrMap(essData[i]['name']) + ": " + essData[i]['value']
    // cardBody.appendChild(p)
    cardtext.appendChild(p)
  }

  var chart1div = createElement('div', 'class=col-md-4')
  var cardchart1 = createElement('canvas', 'id=soc' + essTypeId + essId)
  chart1div.appendChild(cardchart1)

  var chart2div = createElement('div', 'class=col-md-4')
  var cardchart2 = createElement('canvas', 'id=dod' + essTypeId + essId)
  chart2div.appendChild(cardchart2)

  cardBody.appendChild(cardtext)
  cardBody.appendChild(chart1div)
  cardBody.appendChild(chart2div)
  var essdisplay = document.getElementById('esss')
  if (essdisplay.childElementCount === 0) {
    // if(essdisplay.childElementCount === 0 || (essdisplay.lastElementChild !== null && essdisplay.lastElementChild.childElementCount === 3)){
    var row = createElement('div', 'class=row')
    essdisplay.appendChild(row)
  }

  cardBody.appendChild(btndiv)
  card.appendChild(cardHead)
  card.appendChild(cardBody)
  cardiv.appendChild(card)
  essdisplay.lastElementChild.appendChild(cardiv)

  editbtn.addEventListener('click', function (e) {
    ipc.send('editEsstObj', [essType, essId, essObjList[essType][essId]])
  })

  deletebtn.addEventListener('click', function (e) {
    delete essObjList[essType][essId]
    cardiv.remove()
    createTopology()
  })

  // a very weird fixer for chart not shwoing...
  // var ctx = document.getElementById("dod" + essTypeId + essId).getContext('2d');
  // var chart = new Chart(ctx, {
  //   // The type of chart we want to create
  //   type: 'line',

  //   // The data for our dataset
  //   data: {
  //     labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  //     datasets: [{
  //       label: 'My First dataset',
  //       backgroundColor: 'rgb(255, 99, 132)',
  //       borderColor: 'rgb(255, 99, 132)',
  //       data: [0, 10, 5, 2, 20, 30, 45]
  //     }]
  //   },

  //   // Configuration options go here
  //   options: {}
  // });

  socprofile.config['options']['responsive'] = true
  socprofile.config['options']['maintainAspectRatio'] = false
  dodprofile.config['options']['responsive'] = true
  dodprofile.config['options']['maintainAspectRatio'] = false
  cardchart1.style.height = "168px"
  cardchart2.style.height = "168px"

  // var socchart = new Chart(document.getElementById("soc"+essTypeId+essId).getContext('2d'), socprofile.config)
  // var dodchart = new Chart(document.getElementById("dod"+essTypeId+essId).getContext('2d'), dodprofile.config)
  var soc1chart = new Chart(cardchart1, socprofile.config)
  var dod1chart = new Chart(cardchart2, dodprofile.config)
}

function editEssElement(essType, essId, essData, socprofile, dodprofile) {

  essTypeId = essType.replace(/\s+/g, "")

  var cardObject = document.getElementById(essTypeId + "-" + essId)
  var pObject = cardObject.querySelectorAll('p')

  for (var i = 0; i < 7; i++) {
    pObject[i].innerHTML = strMap.eiStrMap(essData[i + 1]['name']) + ": " + essData[i + 1]['value']
  }

  cardObject.querySelector('button').innerHTML = essType + "-" + essId + "  (Quantity: " + essData[0]['value'] + ")"

  socprofile.config['options']['responsive'] = true
  socprofile.config['options']['maintainAspectRatio'] = false
  dodprofile.config['options']['responsive'] = true
  dodprofile.config['options']['maintainAspectRatio'] = false
  var socchart = new Chart(document.getElementById("soc" + essTypeId + essId), socprofile.config)
  var dodchart = new Chart(document.getElementById("dod" + essTypeId + essId), dodprofile.config)
}

function createElement(type, ...args) {
  var ele = document.createElement(type)
  for (var i = 0; i < args.length; i++) {
    var kv = args[i].split('=')
    ele.setAttribute(kv[0], kv[1])
  }
  return ele
}

function createDataElem(args) {
  var data = args
  var downloadbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'id=dataDownloadBtn')
  downloadbtn.innerHTML = 'Download'
  var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
  deletebtn.innerHTML = 'Delete'

  var cardBody = createElement('div', 'class=card-body')

  var card = createElement('div', 'class=card mb-1', 'id=' + data)
  var cardiv = createElement('div', 'class=col-sm-4')


  for (const [key, value] of Object.entries(data)) {
    var p
    if (key === 'id' || key === 'irr' || key === 'revenue' || key === 'pbp') {
      p = createElement('p', 'class=mb-1 ')
      p.innerHTML = (strMap.diStrMap(key) + ": " + (+value.toFixed(2))).bold()
      cardBody.appendChild(p)
    } else if (key === 'percentages') {
      p = createElement('p', 'class=mb-1 ')
      p.innerHTML = (strMap.diStrMap(key) + ": " + value).bold()
      cardBody.appendChild(p)
    } else if (key === 'prices') {
      numOfMarket = value.length
      for (j=0;j<numOfMarket;j++){
        p = createElement('p', 'class=mb-1 ')
        p.innerHTML = (data['config']['markets'][j]['name'] + "<br /> Buying Price: " + (+value[0][0].toFixed(2)) + "<br />" + "Selling Price: " + (+value[0][1].toFixed(2))).bold()
        cardBody.appendChild(p) 
      }
      // if (numOfMarket >= 1) {
      //   p = createElement('p', 'class=mb-1 ')
      //   p.innerHTML = ("Primary<br /> Buying Price: " + (+value[0][0].toFixed(2)) + "<br />" + "Selling Price: " + (+value[0][1].toFixed(2))).bold()
      //   cardBody.appendChild(p)
      // }
      // if (numOfMarket >= 2) {
      //   p = createElement('p', 'class=mb-1 ')
      //   p.innerHTML = ("Secondary<br /> Buying Price: " + (+value[1][0].toFixed(2)) + "<br />" + "Selling Price: " + (+value[1][1].toFixed(2))).bold()
      //   cardBody.appendChild(p)
      // }
      // if (numOfMarket >= 3) {
      //   p = createElement('p', 'class=mb-1 ')
      //   p.innerHTML = ("Tertiary<br /> Buying Price: " + (+value[2][0].toFixed(2)) + "<br />" + "Selling Price: " + (+value[2][1].toFixed(2))).bold()
      //   cardBody.appendChild(p)
      // }
    }
  }

  var dataDisplay = document.getElementById('dataComparison')
  if (dataDisplay.childElementCount === 0) {
    var row = createElement('div', 'class=row mt-2')
    dataDisplay.appendChild(row)
  }

  cardBody.appendChild(downloadbtn)
  cardBody.appendChild(deletebtn)
  card.appendChild(cardBody)
  cardiv.appendChild(card)
  dataDisplay.lastElementChild.appendChild(cardiv)


  downloadbtn.addEventListener('click', function (e) {
    tot_timestamps = data['soc'].length
    numOfBattery = data['soc'][0].length
    numOfMarket = data['prices'].length
    config = data['config']

    // 'id': self.global_id,
    // 'revenue': revenue/1000,
    // 'irr': irr,
    // 'pbp': pbp,
    // 'soc': soc.tolist(),
    // 'soh': soh.tolist(),
    // # 'soh': soh_array,
    // 'years': years,
    // 'power': storage.tolist(),
    // 'prices': np.reshape(current_value_params, [-1, 2]).tolist(),
    // 'percentages': percentage,
    // 'time': meta_data['time'],
    // 'power_market': meta_data['power_market'].tolist(),
    // 'market_decision': meta_data['market_decision'],
    // 'revenue_record': meta_data['revenue'],
    // 'penalty_record': meta_data['penalty'],
    // 'tot_revenue_record': meta_data['tot_revenue'],
    // 'tot_penalty_record': meta_data['tot_penalty'],
    // 'setpoint': meta_data['setpoint'].tolist(),
    // 'config': meta_data['config']

    // console.log("num of battery: " + numOfBattery + "    num of market: " + numOfMarket)
    marketTitle = ""
    bp = ""
    sp = ""
    percentage = ""
    if (numOfMarket >= 1) {
      marketTitle += config['markets'][0]['name']
      bp += data['prices'][0][0].toFixed(2)
      sp += data['prices'][0][1].toFixed(2)
      percentage += data['percentages'][0]
    }
    if (numOfMarket >= 2) {
      marketTitle += "," + config['markets'][1]['name']
      bp += ',' + data['prices'][1][0].toFixed(2)
      sp += ',' + data['prices'][1][1].toFixed(2)
      percentage += ',' + data['percentages'][1]
    }
    if (numOfMarket >= 3) {
      marketTitle += "," + config['markets'][2]['name']
      bp += ',' + data['prices'][2][0].toFixed(2)
      sp += ',' + data['prices'][2][1].toFixed(2)
      percentage += ',' + data['percentages'][2]
    }

    var lineArray = ["Simulation time (days), " + (tot_timestamps / 1440).toFixed(2),
    "Battery Life (Years)," + (+data['x'].toFixed(2)) + ",,," + marketTitle,
    "IRR (%)," + (+data['irr'].toFixed(6)) + ",,Buying Price," + bp,
    "Revenue (kEuro)," + (+data['revenue'].toFixed(2)) + ",,Selling Price," + sp,
    "PBP (Years)," + (+data['pbp'].toFixed(6)) + ",,Percentage," + percentage]
    lineArray.push("")
    let title = ","
    for (i = 0; i < numOfBattery; ++i) {
      title += "Energy Source " + (i + 1) + ":" + config['energy_sources'][i]['name'] + ",,,,"
    }
    for (i = 0; i < numOfMarket; ++i) {
      title += "Market " + (i + 1) + ":" + config['markets'][i]['name'] + ",,,,"
    }
    title += "Overall, "
    lineArray.push(title)

    title = "Time, "
    for (i = 0; i < numOfBattery; ++i) {
      title += "Power Input (MW), Power Output (MW), State-of-Charge (%), State-of-Health (%), "
    }
    for (i = 0; i < numOfMarket; ++i) {
      title += "Power Bought (MW), Power Sold (MW), Setpoint, Market Decision, "
    }
    title += "Penalty (kEuro), Total Penalty (kEuro), Revenue (kEuro), Total Revenue (kEuro)"
    lineArray.push(title)
    for (i = 0; i < tot_timestamps; ++i) {
      line = ""
      // d = new Date(timestamp)
      // ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
      // mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d)
      // da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)
      // hour = new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false }).format(d)
      // min = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d)
      // if (hour == 24)
      //   hour = '00'
      // if (min.length == 1)
      //   min = '0' + min
      // timeString = `${mo}-${da}-${ye} ${hour}:${min}`
      timeString = data['time'][i]
      // console.log(timeString)
      line += timeString
      line += ', '
      // if (numOfBattery == 1) {
      //   line += data['power'][i][0].toFixed(2) + ", " + data['power'][i][1].toFixed(2) + ", "
      //   line += data['soc'][i].toFixed(2) + ", " + data['soh'][i].toFixed(2) + ", "
      // } else {
      for (j = 0; j < numOfBattery; ++j) {
        line += data['power'][i][0][j].toFixed(2) + ", " + data['power'][i][1][j].toFixed(2) + ", "
        line += (100 * data['soc'][i][j]).toFixed(2) + ", " + (100 * data['soh'][i][j]).toFixed(6) + ", "
      }

      // }

      // if (numOfMarket == 1) {
      //   line += data['power_market'][i][0].toFixed(2) + ", " + data['power_market'][i][1].toFixed(2) + ", "
      //   line += data['setpoint'][i][0].toFixed(2) + ", " + data['market_decision'][i][0] + ", "
      // } else {
      for (j = 0; j < numOfMarket; ++j) {
        line += data['power_market'][i][0][j].toFixed(2) + ", " + data['power_market'][i][1][j].toFixed(2) + ", "
        line += data['setpoint'][i][j].toFixed(2) + ", " + (data['market_decision'][i][j] || " ") + ", "
      }

      // }

      line += data['penalty_record'][i].toFixed(2) + ", " + data['tot_penalty_record'][i].toFixed(2) + ', '
      line += data['revenue_record'][i].toFixed(2) + ", " + data['tot_revenue_record'][i].toFixed(2)

      lineArray.push(line)
    }

    console.log('lineArray ready!')

    // var lineArray = ["IRR," + (+data['x'].toFixed(6)), "Year,"+(+data['y'].toFixed(2))]

    // title += "Power Output, Power Input, "
    // for (i=0;i<numOfBattery;++i){
    //   title += "Battery " + (i+1)
    //   if(i != numOfBattery - 1)
    //     title += ',' 
    // }
    // lineArray.push(title)

    // for(i=0; i<data['soc'].length; ++i){
    //   line = ""

    //   for (j=0;j<numOfMarket;++j){
    //     if(i<data['prices'].length){
    //       line += '' + data['prices'][i][j][0] + ',' + data['prices'][i][j][1] + ','
    //     }else{
    //       line += ',,'
    //     }
    //   }
    //   // if(i<data['prices'].length){
    //   //   line += '' + data['prices'][i][0] + ',' + data['prices'][i][1] + ',' 
    //   // }else{
    //   //   line += ',,'
    //   // }
    //   if(i<data['power'].length){
    //     line += '' + data['power'][i][0] + ',' + data['power'][i][1] + ',' 
    //   }else{
    //     line += ',,'
    //   }
    //   for (j=0;j<numOfBattery;++j){
    //     line += '' + data['soc'][i][j]
    //     if(j != numOfBattery - 1)
    //       line += ',' 
    //   }

    //   lineArray.push(line)
    // }

    let csvContent = lineArray.join('\n')
    var filename
    filename = dialog.showSaveDialog({
      filters: [{
        name: 'CSV',
        extensions: ['csv']
      }]
    }).then(result => {
      filename = result.filePath
      if (filename === undefined) {
        alert("Filename invalid, file not created!")
        return
      }
      fs.writeFile(filename, csvContent, (err) => {
        if (err) {
          console.log("An error ocurred creating the file " + err.message)
          return
        }
        console.log("Succesfully saved")
      })
    }).catch(err => {
      alert(err)
    })
  })
  deletebtn.addEventListener('click', function (e) {
    cardiv.remove()
  })

}

var irrParetoChart
var revParetoChart
function handleClickIRR(evt) {
  var activeElement = irrParetoChart.getElementAtEvent(evt)
  if (activeElement.length > 0) {
    args = irrParetoChart.data.datasets[activeElement[0]._datasetIndex].data[activeElement[0]._index]
    createDataElem(args)
  }
}
function handleClickRev(evt) {
  var activeElement = revParetoChart.getElementAtEvent(evt)
  if (activeElement.length > 0) {
    args = revParetoChart.data.datasets[activeElement[0]._datasetIndex].data[activeElement[0]._index]
    createDataElem(args)
  }
}

function handleHoverIRR(c, id) {
  var idx = 0,
    dataset = 0
  for (var j = 0; j < 2; j++) {
    for (var i = 0; i < c.data.datasets[j].data.length; i++) {
      if (c.data.datasets[j].data[i]['id'] == id) {
        idx = i
        dataset = j
        break;
      }
    }
  }

  var meta = c.getDatasetMeta(dataset),
    rect = c.canvas.getBoundingClientRect(),
    point = meta.data[idx].getCenterPoint(),
    evt = new MouseEvent('mousemove', {
      clientX: rect.left + point.x,
      clientY: rect.top + point.y
    }),
    node = c.canvas;
  node.dispatchEvent(evt);
}

function getParameters() {
  parameters = {
    'energy_sources': [
      {
        'energy_type': 'Lithium-Ion',
        'soc_profile_energy_scale': 20,
        'soc_profile_max_input_th': 100,
        'soc_profile_min_output_th': 0,
        'soc_profile_max_power_upward': 10,
        'soc_profile_max_power_downward': 10,
        'efficiency_upward': 0.95,
        'efficiency_downward': 0.95,
        'cost': 310,
        'dod_profile': True,
        'd1': 2,
        'c1': 10000000,
        'd2': 4,
        'c2': 1000000,
        'd3': 17,
        'c3': 100000,
        'd4': 30,
        'c4': 40000,
        'd5': 60,
        'c5': 10000,
        'd6': 100,
        'c6': 3000
      },
      {
        'energy_type': 'PowerFlow',
        'soc_profile_energy_scale': 40,
        'soc_profile_max_input_th': 70,
        'soc_profile_min_output_th': 30,
        'soc_profile_max_power_upward': 10,
        'soc_profile_max_power_downward': 10,
        'efficiency_upward': 0.78,
        'efficiency_downward': 0.78,
        'cost': 470,
        'dod_profile': False,
        'd1': 0,
        'c1': 10,
        'd2': 0,
        'c2': 10,
        'd3': 0,
        'c3': 0,
        'd4': 0,
        'c4': 0,
        'd5': 0,
        'c5': 0,
        'd6': 0,
        'c6': 0
      }
    ],
    'markets': [
      {
        "time_window_in_delivery": 4,
        "planning_phase_length": 60,
        "selection_phase_length": 60,
        "schedule_phase_length": 60,
        "delivery_phase_length": 60,
        "setpoint_interval": 1,
        "percentage_fixed": true,
        "price_cyclic_eps_upward": 1,
        "price_cyclic_eps_downward": 1,
        "percentage_cyclic_eps": 1,
      },
      {
        "time_window_in_delivery": 4,
        "planning_phase_length": 60,
        "selection_phase_length": 60,
        "schedule_phase_length": 60,
        "delivery_phase_length": 60,
        "setpoint_interval": 1,
        "percentage_fixed": true
      },
      {
        "time_window_in_delivery": 4,
        "planning_phase_length": 60,
        "selection_phase_length": 60,
        "schedule_phase_length": 60,
        "delivery_phase_length": 60,
        "setpoint_interval": 1,
      },
    ],
    'config': {
      'planning_horizon': 60,
      'soh_update_interval': 24 * 7 * 60,
      'tot_timestamps': 60
    }
  }
  return parameters
}
function compareData(a, b) {
  if (a['x'] > b['x']) return 1;
  if (a['x'] < b['x']) return -1;

  return 0;
}
function updateChartData(data) {
  var revData = $.extend(true, {}, data)
  data['x'] = data['years']
  revData['x'] = revData['years']
  data['y'] = data['irr']
  revData['y'] = revData['revenue']

  if (irrParetoChart.data.datasets[0].data.length == 0 && irrParetoChart.data.datasets[1].data.length == 0) {
    irrParetoChart.data.datasets[1].data.push(data)
  } else {
    pushTo = 0
    for (var i = 0; i < irrParetoChart.data.datasets[1].data.length; i++) {

      if ((data['x'] >= irrParetoChart.data.datasets[1].data[i]['x'] &&
        data['y'] >= irrParetoChart.data.datasets[1].data[i]['y'])) {
        pushTo = 1
        tmp = irrParetoChart.data.datasets[1].data.splice(i, 1)
        irrParetoChart.data.datasets[0].data.push(tmp[0])
        i--
      } else if ((data['x'] > irrParetoChart.data.datasets[1].data[i]['x'] ||
        data['y'] > irrParetoChart.data.datasets[1].data[i]['y'])) {
        pushTo = 1
      } else if ((data['x'] < irrParetoChart.data.datasets[1].data[i]['x'] &&
        data['y'] < irrParetoChart.data.datasets[1].data[i]['y'])) {
        pushTo = 0
        break
      }
    }

    irrParetoChart.data.datasets[pushTo].data.push(data)
    if (pushTo == 1) {
      irrParetoChart.data.datasets[1].data.sort(compareData)
    }
  }
  if (revParetoChart.data.datasets[0].data.length == 0 && revParetoChart.data.datasets[1].data.length == 0) {
    revParetoChart.data.datasets[1].data.push(revData)
  } else {
    pushTo = 0
    for (var i = 0; i < revParetoChart.data.datasets[1].data.length; i++) {

      if ((revData['x'] >= revParetoChart.data.datasets[1].data[i]['x'] &&
        revData['y'] >= revParetoChart.data.datasets[1].data[i]['y'])) {
        pushTo = 1
        tmp = revParetoChart.data.datasets[1].data.splice(i, 1)
        revParetoChart.data.datasets[0].data.push(tmp[0])
        i--
      } else if ((revData['x'] > revParetoChart.data.datasets[1].data[i]['x'] ||
        revData['y'] > revParetoChart.data.datasets[1].data[i]['y'])) {
        pushTo = 1
      } else if ((revData['x'] < revParetoChart.data.datasets[1].data[i]['x'] &&
        revData['y'] < revParetoChart.data.datasets[1].data[i]['y'])) {
        pushTo = 0
        break
      }
    }

    revParetoChart.data.datasets[pushTo].data.push(revData)
    if (pushTo == 1) {
      revParetoChart.data.datasets[1].data.sort(compareData)
    }
  }
  irrParetoChart.update()
  revParetoChart.update()
}


function generateHorizonChart() {
  horizontime = new Chart(document.getElementById('horizontime'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: "execution time",
            data: [{x: 100, y:1.1071927499771118},
              {x: 200, y:1.1157951807975769},
              {x: 300, y:1.3206633806228638},
              {x: 400, y:1.5165351700782776},
              {x: 500, y:1.7447242093086243},
              {x: 600, y:1.730249879360199},
              {x: 700, y:1.8039585494995117},
              {x: 800, y:2.0357539701461792},
              {x: 900, y:2.2950398778915405},
              {x: 1000, y:2.8807509183883667},
              {x: 1100, y:3.029982349872589},
              {x: 1200, y:3.3090636801719666},
              {x: 1300, y:3.662331759929657},
              {x: 1400, y:4.047674970626831},
              {x: 1500, y:4.422535581588745},
              {x: 1600, y:4.824610710144043},
              {x: 1700, y:5.741664760112762},
              {x: 1800, y:6.286210460662842},
              {x: 1900, y:6.842949900627136},
              {x: 2000, y:7.453676199913025},
              {x: 2100, y:8.396958329677582},
              {x: 2200, y:8.744274771213531},
              {x: 2300, y:9.554511501789093},
              {x: 2400, y:11.198296909332275}],
            showLine: true
          }]},
      options: {
          title: {
              display: false,
              text: 'Time'
          },
          scales: {
              yAxes: [{
                  scaleLabel: {
                      display: true,
                      labelString: 'Execution Time'
                  },
              }],
              xAxes: [{
                  scaleLabel: {
                      display: true,
                      labelString: 'Planning Horizon'
                  },
              }]
          }
      }
  })
  horizonquality = new Chart(document.getElementById('horizonquality'), {
    type: 'scatter',

    data: {
      datasets: [
        {
          label: "strategy quality",
          data: [{x:100, y:6015.174424500852 / 7200},
            {x:200, y:7015.192395586166 / 7200},
            {x:300, y:7088.487232713391 / 7200},
            {x:400, y:7080.472046329362 / 7200},
            {x:500, y:6960.3200078483715 / 7200},
            {x:600, y:6870.814019403093 / 7200},
            {x:700, y:6888.387555798566 / 7200},
            {x:800, y:6574.051504836913 / 7200},
            {x:900, y:6506.336433732839 / 7200},
            {x:1200, y:6402.521962391004 / 7200},
            {x:1500, y:6053.727190102876 / 7200},
            {x:1900, y:5316.995741647057 / 7200}],
          showLine: true
        }]},
    options: {
        title: {
            display: false,
            text: 'Time'
        },
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Strategy Quality'
                },
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Planning Horizon'
                },
            }]
        }
    }
})
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
  }

  var config = {
    fontSize: 50,
    data: {
      datasets: [{
        label: 'Inferior Datapoints',
        borderColor: window.chartColors.red,
        borderWidth: 2,
        fill: false,
        data: [],
        pointHoverRadius: 10
      }, {
        label: 'Pareto Frontier',
        cubicInterpolationMode: 'monotone',
        borderColor: window.chartColors.blue,
        borderWidth: 2,
        fill: false,
        data: [],
        borderWidth: 2.5,
        tension: 1,
        showLine: true,
        pointHoverRadius: 10
      }]
    },
    options: {
      onClick: handleClickIRR,
      // events: ['mousemove', 'click', 'touchstart'],
      plugins: {
        zoom: {
          // Container for pan options
          pan: {
            // Boolean to enable panning
            enabled: true,

            // Panning directions. Remove the appropriate direction to disable
            // Eg. 'y' would only allow panning in the y direction
            // A function that is called as the user is panning and returns the
            // available directions can also be used:
            //   mode: function({ chart }) {
            //     return 'xy';
            //   },
            mode: 'xy',

            rangeMin: {
              // Format of min pan range depends on scale type
              x: null,
              y: null
            },
            rangeMax: {
              // Format of max pan range depends on scale type
              x: null,
              y: null
            },

            // On category scale, factor of pan velocity
            speed: 20,

            // Minimal pan distance required before actually applying pan
            threshold: 10,

            // Function called while the user is panning
            onPan: function ({ chart }) { console.log(`I'm panning!!!`); },
            // Function called once panning is completed
            onPanComplete: function ({ chart }) { console.log(`I was panned!!!`); }
          },

          // Container for zoom options
          zoom: {
            // Boolean to enable zooming
            enabled: true,

            // Enable drag-to-zoom behavior
            drag: true,

            // Drag-to-zoom effect can be customized
            // drag: {
            // 	 borderColor: 'rgba(225,225,225,0.3)'
            // 	 borderWidth: 5,
            // 	 backgroundColor: 'rgb(225,225,225)',
            // 	 animationDuration: 0
            // },

            // Zooming directions. Remove the appropriate direction to disable
            // Eg. 'y' would only allow zooming in the y direction
            // A function that is called as the user is zooming and returns the
            // available directions can also be used:
            //   mode: function({ chart }) {
            //     return 'xy';
            //   },
            mode: 'xy',

            rangeMin: {
              // Format of min zoom range depends on scale type
              x: null,
              y: null
            },
            rangeMax: {
              // Format of max zoom range depends on scale type
              x: null,
              y: null
            },

            // Speed of zoom via mouse wheel
            // (percentage of zoom on a wheel event)
            speed: 0.1,

            // On category scale, minimal zoom level before actually applying zoom
            sensitivity: 3,

            // Function called while the user is zooming
            onZoom: function ({ chart }) { console.log(`I'm zooming!!!`); },
            // Function called once zooming is completed
            onZoomComplete: function ({ chart }) { console.log(`I was zoomed!!!`); }
          }
        }
      },
      responsive: true,
      aspectRatio: 1.5,
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            // var pbp = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['pbp']
            // var revenue = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['revenue']
            temp = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]
            handleHoverIRR(revParetoChart, temp['id'])
            return [
              ['id: ' + temp['id']],
              ['Buying Price: ' + (+temp['prices'][0][0].toFixed(2))],
              ['Selling Price: ' + (+temp['prices'][0][1].toFixed(2))],
              ['Battery Life: ' + (+temp['x'].toFixed(2))],
              ['IRR: ' + (+temp['irr'].toFixed(2)) + '%'],
              ['Revenues: ' + (+temp['revenue'].toFixed(2)) + 'k'],
              ['PBP: ' + (+temp['pbp'].toFixed(2))]
            ]

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
        text: 'Battery Life vs IRR',
        fontSize: 20
      },
      scales: {
        xAxes: [{
          ticks: {
            fontSize: 15
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Estimated Battery Life (Year)',
            fontSize: 20
          }
        }],
        yAxes: [{
          ticks: {
            fontSize: 15
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Internal Rate of Return (%)',
            fontSize: 20
          }
        }]
      }
    }
  }
  var configRev = $.extend(true, {}, config)
  configRev['options']['onClick'] = handleClickRev
  configRev['options']['tooltips']['callbacks'] = {
    label: function (tooltipItem, data) {
      temp = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]
      handleHoverIRR(irrParetoChart, temp['id'])
      return [
        ['id: ' + temp['id']],
        ['Buying Price: ' + (+temp['prices'][0][0].toFixed(2))],
        ['Selling Price: ' + (+temp['prices'][0][1].toFixed(2))],
        ['Battery Life: ' + (+temp['x'].toFixed(2))],
        ['IRR: ' + (+temp['irr'].toFixed(2)) + '%'],
        ['Revenues: ' + (+temp['revenue'].toFixed(2)) + 'k'],
        ['PBP: ' + (+temp['pbp'].toFixed(2))]
      ]

    }
  }
  configRev['options']['title']['text'] = 'Battery Life vs Revenues'
  configRev['options']['scales']['yAxes'][0]['scaleLabel']['labelString'] = 'Revenues (kEuro)'

  var ctxIRR = document.getElementById("irrParetoChart").getContext("2d")
  irrParetoChart = new Chart.Scatter(ctxIRR, config)
  var ctxRev = document.getElementById("revParetoChart").getContext("2d")
  revParetoChart = new Chart.Scatter(ctxRev, configRev)
}

// file
// document.querySelector('#primaryFile').addEventListener('change', uploadFile);
// document.querySelector('#secondaryFile').addEventListener('change', uploadFile);
// document.querySelector('#tertiaryFile').addEventListener('change', uploadFile);


document.querySelectorAll('.custom-file input').forEach(e => {
  e.addEventListener('change', uploadFile)
})


function uploadFile(e) {
  var labels = document.getElementsByTagName('LABEL');
  for (var i = 0; i < labels.length; i++) {
    if (labels[i].htmlFor === e.target.id) {
      labels[i].innerHTML = e.target.files[0].name
    }
  }
  marketDataList[e.target.id] = e.target.files[0].path
  // if validate, check here
  // const workbook = XLSX.readFile(e.target.files[0].path);
  // const sheet_name_list = workbook.SheetNames;
  // console.log(XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]))
}

function updateFileSetting(e) {
  document.querySelectorAll('.primary-file').forEach(e => {
    e.disabled = ('Primary Reserve' in marketObjList) ? false : true
  })
  document.querySelectorAll('.secondary-file').forEach(e => {
    e.disabled = ('Secondary Reserve' in marketObjList) ? false : true
  })
  document.querySelectorAll('.tertiary-file').forEach(e => {
    e.disabled = ('Tertiary Reserve' in marketObjList) ? false : true
  })
}

function formValidation() {
  var inputs = document.getElementsByTagName('input')
  var missing = []
  for (var i = 0; i < inputs.length; i++) {
    if (i < 6) {
      if (inputs[i].value === null || inputs[i].value === "" && inputs[i].disabled === false) {
        missing.push(strMap.ciStrMap(inputs[i].name))
      }
    } else {
      if (inputs[i].files.length === 0 && inputs[i].disabled === false) {
        missing.push(strMap.fiStrMap(inputs[i].id))
      }
    }
  }
  return missing
}

function isObjEmpty() {
  for(let type in essObjList) {
    if(Object.keys(essObjList[type]).length !== 0) return false
  }
  return true
}

// topology

var gojs = go.GraphObject.make;

var myDiagram =
  gojs(go.Diagram, "myDiagramDiv",
    {
      "undoManager.isEnabled": true,
      layout: gojs(go.TreeLayout,
        { angle: 0, layerSpacing: 35 })
    });

function createTopology() {
  if(isObjEmpty()) {
    var model = gojs(go.GraphLinksModel);
    model.nodeDataArray = []
    model.linkDataArray = []
    myDiagram.model = model;
    return
  }

  var nodeDataArray = []
  
  for (let type in essObjList) {
    for (let num in essObjList[type]) {
      let obj = {
        key: type + '-' + num.toString(),
        name: type + '-' + num.toString(),
        color: '#1E8449',
        geo: 'battery100'
      }
      nodeDataArray.push(obj)
    }
  }

  for (let market in marketObjList) {
    let obj = {
      key: market,
      name: market.split(' ')[0],
      // color: '#8AA399', 
      color: '#2874A6',
      // stroke: 'white',
      geo: 'reserve'
      // geometry: genControlCenter(10, 2)
    }
    nodeDataArray.push(obj)
  }

  let marketobj = {
    key: 'mid', name: 'Grid', color: 'gray', geo: 'grid'//, stroke: 'white'
  }

  nodeDataArray.push(marketobj)

  var linkDataArray = []

  for(let i = 0; i < nodeDataArray.length; i++) {
    if(nodeDataArray[i].key.includes('-')){
      linkDataArray.push({
        from: nodeDataArray[i].key, to: 'mid', color: 'lightgreen'
      })
    } else if(nodeDataArray[i].key !== 'mid') {
      linkDataArray.push({
        to: nodeDataArray[i].key, from: 'mid', color: 'lightblue'
      })
    }
  }

  var icons = {
    "battery100":
    "M30 8v12h-26v-12h26zM32 17h2v-6h-2v-4.5c0-0.281-0.219-0.5-0.5-0.5h-29c-0.281 0-0.5 0.219-0.5 0.5v15c0 0.281 0.219 0.5 0.5 0.5h29c0.281 0 0.5-0.219 0.5-0.5v-4.5zM36 11v6c0 1.109-0.891 2-2 2v2.5c0 1.375-1.125 2.5-2.5 2.5h-29c-1.375 0-2.5-1.125-2.5-2.5v-15c0-1.375 1.125-2.5 2.5-2.5h29c1.375 0 2.5 1.125 2.5 2.5v2.5c1.109 0 2 0.891 2 2z",
    "battery0":
    "M34 9c1.109 0 2 0.891 2 2v6c0 1.109-0.891 2-2 2v2.5c0 1.375-1.125 2.5-2.5 2.5h-29c-1.375 0-2.5-1.125-2.5-2.5v-15c0-1.375 1.125-2.5 2.5-2.5h29c1.375 0 2.5 1.125 2.5 2.5v2.5zM34 17v-6h-2v-4.5c0-0.281-0.219-0.5-0.5-0.5h-29c-0.281 0-0.5 0.219-0.5 0.5v15c0 0.281 0.219 0.5 0.5 0.5h29c0.281 0 0.5-0.219 0.5-0.5v-4.5h2z",
    "battery25":
    "M4 20v-12h8v12h-8zM34 9c1.109 0 2 0.891 2 2v6c0 1.109-0.891 2-2 2v2.5c0 1.375-1.125 2.5-2.5 2.5h-29c-1.375 0-2.5-1.125-2.5-2.5v-15c0-1.375 1.125-2.5 2.5-2.5h29c1.375 0 2.5 1.125 2.5 2.5v2.5zM34 17v-6h-2v-4.5c0-0.281-0.219-0.5-0.5-0.5h-29c-0.281 0-0.5 0.219-0.5 0.5v15c0 0.281 0.219 0.5 0.5 0.5h29c0.281 0 0.5-0.219 0.5-0.5v-4.5h2z",
    "battery50":
    "M4 20v-12h14v12h-14zM34 9c1.109 0 2 0.891 2 2v6c0 1.109-0.891 2-2 2v2.5c0 1.375-1.125 2.5-2.5 2.5h-29c-1.375 0-2.5-1.125-2.5-2.5v-15c0-1.375 1.125-2.5 2.5-2.5h29c1.375 0 2.5 1.125 2.5 2.5v2.5zM34 17v-6h-2v-4.5c0-0.281-0.219-0.5-0.5-0.5h-29c-0.281 0-0.5 0.219-0.5 0.5v15c0 0.281 0.219 0.5 0.5 0.5h29c0.281 0 0.5-0.219 0.5-0.5v-4.5h2z",
    "battery75":
    "M4 20v-12h20v12h-20zM34 9c1.109 0 2 0.891 2 2v6c0 1.109-0.891 2-2 2v2.5c0 1.375-1.125 2.5-2.5 2.5h-29c-1.375 0-2.5-1.125-2.5-2.5v-15c0-1.375 1.125-2.5 2.5-2.5h29c1.375 0 2.5 1.125 2.5 2.5v2.5zM34 17v-6h-2v-4.5c0-0.281-0.219-0.5-0.5-0.5h-29c-0.281 0-0.5 0.219-0.5 0.5v15c0 0.281 0.219 0.5 0.5 0.5h29c0.281 0 0.5-0.219 0.5-0.5v-4.5h2z",
    "grid":
    "M12 0l-12 16h12l-8 16 28-20h-16l12-12z",
    "reserve":
    "M32 19l-6-6v-9h-4v5l-6-6-16 16v1h4v10h10v-6h4v6h10v-10h4z"
  };
  
  function geoFunc(geoname) {
    var geo = icons[geoname];
    if (typeof geo === "string") {
      geo = icons[geoname] = go.Geometry.parse(geo, true);
    }
    return geo;
  }
  
  myDiagram.nodeTemplate =
    gojs(go.Node, "Vertical", 
      {
        fromSpot: go.Spot.Right, toSpot: go.Spot.Left
      },
      // gojs(go.Node, "Auto",
      // gojs(go.Shape, "Circle",
      // { fill: "lightcoral", strokeWidth: 0, width: 65, height: 65 },
      // new go.Binding("fill", "color")),
    gojs(go.Shape,
      { margin: 3, strokeWidth: 0 },
      new go.Binding("geometry", "geo", geoFunc),
      new go.Binding("fill", 'color')),
    
  gojs(go.TextBlock, "Default Text", { margin: 12, stroke: "black", font: "bold 16px sans-serif" }, new go.Binding("text", "name"), new go.Binding('stroke', 'stroke'))
    );

    var Colors = {
      "red": "#be4b15",
      "green": "#52ce60",
      "blue": "#6ea5f8",
      "lightred": "#fd8852",
      "lightblue": "#85C1E9",
      "lightgreen": "#7DCEA0",
      "pink": "#faadc1",
      "purple": "#d689ff",
      "orange": "#f08c00"
    }

    // a conversion function for translating general color names to specific colors
    function colorFunc(colorname) {
      var c = Colors[colorname]
      if (c) return c;
      return "gray";
    }
    myDiagram.linkTemplate =
    gojs(go.Link,
      {
        layerName: "Background",
        routing: go.Link.Orthogonal,
        corner: 15,
        reshapable: true,
        resegmentable: true,
        fromSpot: go.Spot.RightSide,
        toSpot: go.Spot.LeftSide
      },
      // make sure links come in from the proper direction and go out appropriately
      new go.Binding("fromSpot", "fromSpot", go.Spot.parse),
      new go.Binding("toSpot", "toSpot", go.Spot.parse),
      new go.Binding("points").makeTwoWay(),
      // mark each Shape to get the link geometry with isPanelMain: true
      gojs(go.Shape, { isPanelMain: true, stroke: "gray", strokeWidth: 10 },
        // get the default stroke color from the fromNode
        new go.Binding("stroke", "fromNode", function(n) { return go.Brush.lighten((n && Colors[n.data.color]) || "gray"); }).ofObject(),
        // but use the link's data.color if it is set
        new go.Binding("stroke", "color", colorFunc)),
      gojs(go.Shape, { isPanelMain: true, stroke: "white", strokeWidth: 3, name: "ELEC", strokeDashArray: [20, 40] })
    );

  var model = gojs(go.GraphLinksModel);

  model.nodeDataArray = nodeDataArray
  model.linkDataArray = linkDataArray
  
  myDiagram.model = model;
  loop();  // animate some flow through the pipes
}

var opacity = 1;
var down = true;
function loop() {
  var diagram = myDiagram;
  setTimeout(function() {
    var oldskips = diagram.skipsUndoManager;
    diagram.skipsUndoManager = true;
    diagram.links.each(function(link) {
      var shape = link.findObject("ELEC");
      var off = shape.strokeDashOffset - 3;
      // animate (move) the stroke dash
      shape.strokeDashOffset = (off <= 0) ? 60 : off;
      // animte (strobe) the opacity:
      if (down) opacity = opacity - 0.01;
      else opacity = opacity + 0.003;
      if (opacity <= 0) { down = !down; opacity = 0; }
      if (opacity > 1) { down = !down; opacity = 1; }
      shape.opacity = opacity;
    });
    diagram.skipsUndoManager = oldskips;
    loop();
  }, 60);
}

