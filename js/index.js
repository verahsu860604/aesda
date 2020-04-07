const electron = require("electron")
const path = require("path")
const url = require("url")
const strMap = require("../js/string.js")
const fs = require("fs")
const {dialog} = require('electron').remote;
const {BrowserWindow} = electron.remote
const ipc = electron.ipcRenderer
const {PythonShell} = require('python-shell')

let marketObjList = {}
// number of ess objects
let essObjNum = {'Power Flow Battery': 0, 'Lithium-Ion': 0, 'Supercapacitor': 0, 'Custom': 0}
let essObjList = {'Power Flow Battery': {}, 'Lithium-Ion': {}, 'Supercapacitor': {}, 'Custom': {}}

generateResultChart()
const barColor = {
  'mi-planning': 'bg-warning',
  'mi-schedule': 'bg-success',
  'mi-selection': 'bg-info',
  'mi-delivery': 'bg-danger',
}

// init config
const defaultVal = {
  'ci-predic': 20, 
  'ci-totTimestamp': 300,
  'ci-sohItv': 24*7*60
}

Object.keys(defaultVal).forEach(e => {
  document.getElementsByName(e)[0].defaultValue = defaultVal[e]
})

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

document.querySelector("#resetChartBtn").addEventListener('click', function() {
    paretoChart.resetZoom()
})

// switch control
// var p = document.getElementById('paretoSwitch').checked
// var f = document.getElementById('fileSwitch').checked

// ipc
ipc.on('createMarketObj', (event, args) => {
    var marketType = args[0]
    var marketData = args[1]
    
    if(marketType in marketObjList) {
        marketObjList[marketType] = marketData
        editMarketElem(marketType, marketData)
    }else {
        marketObjList[marketType] = marketData
        createMarketElem(marketType, marketData) 
        clearDropdownMenu('market')
        toggleMarketItem(marketType)
    }
})

ipc.on('createEssObj', (event, args) => {
    var essType = args[0]
    var essId = args[1]
    var essData = args[2]
    var socprofile = args[3]
    var dodprofile = args[4]

    if(essObjNum[essType] >= essId) {
        essObjList[essType][essId] = essData
        editEssElement(essType, essId, essData, socprofile, dodprofile)
    } else {
        essId = essObjNum[essType] + 1
        essObjNum[essType] = essId    
        essObjList[essType][essId] = essData
        createEssElem(essType, essId, essData, socprofile, dodprofile)
        clearDropdownMenu('ess')
    }
    
})

var progressBar = document.querySelector('#progress .progress .progress-bar')
var progressHint = document.querySelector('#progress-hint')
progressBar.style = "width: 10%"

ipc.on('generateResult', (event, args) => {
	progressBar.classList = "progress-bar progress-bar-striped progress-bar-animated"
	paretoChart.data.datasets[0].data = []
	paretoChart.data.datasets[1].data = []
	paretoChart.update()
	paretoChart.resetZoom()
	progressBar.style = "width: 0%"
    var configForm = $("form").serializeArray()
    ipc.send('run', {configForm, marketObjList, essObjList})
    document.querySelector('#result .alert').style.display = "none"
    document.querySelector('#progress').style.display = ""

}) 

ipc.on('updateProgressBar', (event, args) => {
	progressBar.style = "width: " + args[0] + "%"
	progressHint.innerHTML = 'Simulating... <br />' + 'Current Revenue = ' + args[1]['revenue']
	updateChartData(args[1])
})

ipc.on('doneProgressBar', (event, args) => {
	progressBar.classList = "bg-success"
	progressHint.innerHTML = progressHint.innerHTML.replace('Simulating...', 'Done!')
})

// functions
function createMarketElem(marketType, marketData) {
    console.log(marketData);
    
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
    var bodyContent2 = createElement('div', 'class=progress m-2', 'style=height: 30px', 'id=cardbody2')

    var i = 0
    var j = 0
    var totalPeriod = 0
  
    for(i = 0; i < 8; i++) {
      if(i%4 === 0) var pSec = createElement('div', 'class=col-md-6')
      var p = createElement('p', 'class=mb-1')
      p.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']
      pSec.appendChild(p)
      if(i%4 === 0) bodyContent1.appendChild(pSec)
    }

    for(i = 14; i < 18; i++) totalPeriod += parseInt(marketData[i]['value'])

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

    for(i = 14; i < 18; i++) {
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
      e.innerHTML = strMap.miStrMap(marketData[i]['name']) + ": " + marketData[i]['value']  
      i++
    })

    var i = 0
    var barElem = body2.querySelectorAll('.progress-bar')
    var totalPeriod = 0
    
    for(var j = 14; j < 18; j++) {
      totalPeriod += parseInt(marketData[j]['value'])
    } 

    for(var j = 14; j < 18; j++) {
      var percentage = (marketData[j]['value'] / totalPeriod) * 100
      barElem[i].style.width = percentage+'%'
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
    var cardBody = createElement('div', 'class=card-body row collapse', 'id=body'+essTypeId+"-"+essId, 'aria-labelledby='+essTypeId+"-"+essId, 'data-parent=#head'+essTypeId+"-"+essId)
    var cardHeadBtn = createElement('button', 'class=btn btn-link collapsed p-0', 'data-toggle=collapse', 'data-target=#body'+essTypeId+"-"+essId, 'aria-expanded=false', 'aria-controls='+essTypeId+"-"+essId)
    cardHeadBtn.innerHTML = essType + "-" + essId + " (Quantity: " + essData[0]['value'] + ")"
    var cardHead = createElement('H5', 'class=card-header', 'id=head'+essTypeId+"-"+essId)
    cardHead.appendChild(cardHeadBtn)

    var card = createElement('div', 'class=card mb-3', 'id='+essTypeId+"-"+essId)
    var cardiv = createElement('div', 'class=col-md-12')

    var cardtext = createElement('div', 'class=col-md-4')
    for(var i = 1; i < 8; i++) {
        var p = createElement('p', 'class=mb-1')
        p.innerHTML = strMap.eiStrMap(essData[i]['name']) + ": " + essData[i]['value']
        // cardBody.appendChild(p)
        cardtext.appendChild(p)
    }
        
    var chart1div = createElement('div', 'class=col-md-4')
    var cardchart1 = createElement('canvas', 'id=soc'+essTypeId+essId)
    chart1div.appendChild(cardchart1)

    var chart2div = createElement('div', 'class=col-md-4')
    var cardchart2 = createElement('canvas', 'id=dod'+essTypeId+essId)
    chart2div.appendChild(cardchart2)

    cardBody.appendChild(cardtext)
    cardBody.appendChild(chart1div)
    cardBody.appendChild(chart2div)
    var essdisplay = document.getElementById('esss')
    if(essdisplay.childElementCount === 0){
    // if(essdisplay.childElementCount === 0 || (essdisplay.lastElementChild !== null && essdisplay.lastElementChild.childElementCount === 3)){
        var row = createElement('div', 'class=row')
        essdisplay.appendChild(row)   
    }

    cardBody.appendChild(btndiv)
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

    socprofile.config['options']['responsive'] = true
    socprofile.config['options']['maintainAspectRatio'] = false
    dodprofile.config['options']['responsive'] = true    
    dodprofile.config['options']['maintainAspectRatio'] = false
    cardchart1.style.height = "168px"
    cardchart2.style.height = "168px"
    var socchart = new Chart(cardchart1, socprofile.config)
    var dodchart = new Chart(cardchart2, dodprofile.config)
}

function editEssElement(essType, essId, essData, socprofile, dodprofile) {

    essTypeId = essType.replace(/\s+/g, "")

    var cardObject = document.getElementById(essTypeId+"-"+essId)
    var pObject = cardObject.querySelectorAll('p')
    
    for(var i = 0; i < 7; i++) {
      pObject[i].innerHTML = strMap.eiStrMap(essData[i+1]['name']) + ": " + essData[i+1]['value']
    }

    cardObject.querySelector('button').innerHTML = essType + "-" + essId + "  (Quantity: " + essData[0]['value'] + ")"
  
    socprofile.config['options']['responsive'] = true
    socprofile.config['options']['maintainAspectRatio'] = false
    dodprofile.config['options']['responsive'] = true    
    dodprofile.config['options']['maintainAspectRatio'] = false
    var socchart = new Chart(document.getElementById("soc"+essTypeId+essId), socprofile.config)
    var dodchart = new Chart(document.getElementById("dod"+essTypeId+essId), dodprofile.config)
}

function createElement(type, ...args) {
    var ele = document.createElement(type)
    for(var i = 0; i < args.length; i++) {
        var kv = args[i].split('=')
        ele.setAttribute(kv[0], kv[1])
    }
    return ele
}

function createDataElem(args) {
    var data = args
    var id = data['id']
    delete data['id']
    var downloadbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'id=dataDownloadBtn')
    downloadbtn.innerHTML = 'Download'
    var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
    deletebtn.innerHTML = 'Delete'
    
    var cardBody = createElement('div', 'class=card-body')
    var cardHeadText = document.createTextNode(data)

    var card = createElement('div', 'class=card mb-1', 'id='+data)
    var cardiv = createElement('div', 'class=col-sm-4')
   
  
    for (const [key, value] of Object.entries(data)) {
      var p
      if(key === 'y'){
        p = createElement('p', 'class=mb-1 ')
        p.innerHTML = (strMap.diStrMap(key) + ": " + value.toPrecision(2)).bold()
        cardBody.appendChild(p)
      } else if(key === 'x'){
        p = createElement('p', 'class=mb-1 ')
        p.innerHTML = (strMap.diStrMap(key) + ": " + value.toPrecision(2)).bold()
        cardBody.appendChild(p)
	    } 
	//   else if(strMap.diStrMap(key) == 'undefined'){
		
	// 	continue
	//   }else if(key === 'ess'){
    //     for (const [keyEss, valueEss] of Object.entries(value)) {
    //       p = createElement('p', 'class=mb-1 ')
    //       p.innerHTML = (keyEss + ": " + valueEss).bold()
    //       cardBody.appendChild(p)
    //     }
    //   }else{
    //     p = createElement('p', 'class=mb-1')
    //     p.innerHTML = strMap.diStrMap(key) + ": " + value
    //   }
    //   cardBody.appendChild(p)
    }


    var dataDisplay = document.getElementById('dataComparison')
    if(dataDisplay.childElementCount === 0){
    // if(essdisplay.childElementCount === 0 || (essdisplay.lastElementChild !== null && essdisplay.lastElementChild.childElementCount === 3)){
        var row = createElement('div', 'class=row')
        dataDisplay.appendChild(row)   
    }

    cardBody.appendChild(downloadbtn)
    cardBody.appendChild(deletebtn)
    card.appendChild(cardBody)
    cardiv.appendChild(card)
    dataDisplay.lastElementChild.appendChild(cardiv)


    downloadbtn.addEventListener('click', function(e) {
      var lineArray = ["IRR," + data['x'].toPrecision(2), "Year,"+data['y'].toPrecision(2)]
      numOfBattery = data['soc'][0].length
      numOfMarket = data['prices'][0].length
      let title = ""
      
      for (i=0;i<numOfMarket;++i){
        if(i==0)
          title += "Primary Market Output Price, Primary Market Input Price, "
        else if(i==1)
          title += "Secondary Market Output Price, Secondary Market Input Price, "
        else if(i==2)
          title += "Tertiary Market Output Price, Tertiary Market Input Price, " 
      }
      title += "Power Output, Power Input, "
      for (i=0;i<numOfBattery;++i){
        title += "Battery " + (i+1)
        if(i != numOfBattery - 1)
          title += ',' 
      }
      lineArray.push(title)

      for(i=0; i<data['soc'].length; ++i){
        line = ""
        
        for (j=0;j<numOfMarket;++j){
          if(i<data['prices'].length){
            line += '' + data['prices'][i][j][0] + ',' + data['prices'][i][j][1] + ','
          }else{
            line += ',,'
          }
        }
        // if(i<data['prices'].length){
        //   line += '' + data['prices'][i][0] + ',' + data['prices'][i][1] + ',' 
        // }else{
        //   line += ',,'
        // }
        if(i<data['power'].length){
          line += '' + data['power'][i][0] + ',' + data['power'][i][1] + ',' 
        }else{
          line += ',,'
        }
        for (j=0;j<numOfBattery;++j){
          line += '' + data['soc'][i][j]
          if(j != numOfBattery - 1)
            line += ',' 
        }
        
        lineArray.push(line)
      }

      let csvContent = lineArray.join('\n')
      
      console.log(data)
      console.log(data['soc'][0].length)
      console.log(data['soc'][1].length)
      console.log(data['soc'][2].length)
      console.log(data['power'][0].length)
      console.log(data['power'][0].length)
      console.log(data['power'][0].length)
      console.log(data['prices'].length)
      let content = "temp"
      var filename
      filename = dialog.showSaveDialog({
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }]
      }
        ).then(result => {
          filename = result.filePath
          if (filename === undefined) {
            alert("Filename invalid, file not created!")
            return
          }
          fs.writeFile(filename, csvContent, (err) => {
            if (err) {
              alert("An error ocurred creating the file " + err.message)
              return
            }
            alert("Succesfully saved")
          })
        }).catch(err => {
          alert(err)
        })
    })
    deletebtn.addEventListener('click', function(e) {
        cardiv.remove()
    }) 

}
ipc.on('addDataToCompare', (event, args) => {
  createDataElem(args)
})


var paretoChart
function handleClick(evt){
  var activeElement = paretoChart.getElementAtEvent(evt)
  if(activeElement.length>0){
    args = paretoChart.data.datasets[activeElement[0]._datasetIndex].data[activeElement[0]._index]
    createDataElem(args)
  }
}
function getParameters(){
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
            "test_mode": true,
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
            "test_mode": true,
            "percentage_fixed": true
        },
        {
            "time_window_in_delivery": 4,
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1,
            "test_mode": true
        },
    ],
    'config':{
        'planning_horizon': 60,
        'soh_update_interval': 24 * 7 * 60,
        'tot_timestamps': 60
    }}
  return parameters
}
function compareData(a, b) {
	if (a['x'] > b['x']) return 1;
	if (a['x'] < b['x']) return -1;
  
	return 0;
  }
function updateChartData(data) {
	// TODO soh is zero now, use random to show 
	data['soh'] = Math.random()*10
	data['x'] = data['soh']
	delete data['soh']
	data['y'] = data['revenue']/100
	delete data['revenue']
	if(paretoChart.data.datasets[0].data.length == 0 && paretoChart.data.datasets[1].data.length == 0){
		paretoChart.data.datasets[1].data.push(data)
	} else {
		pushTo = 0
		for( var i = 0; i < paretoChart.data.datasets[1].data.length; i++){

			if((data['x'] >= paretoChart.data.datasets[1].data[i]['x'] &&
				data['y'] >= paretoChart.data.datasets[1].data[i]['y'])){
					pushTo = 1
					tmp = paretoChart.data.datasets[1].data.splice(i, 1)
					paretoChart.data.datasets[0].data.push(tmp[0])
					i--
			} else if ((data['x'] > paretoChart.data.datasets[1].data[i]['x'] ||
						data['y'] > paretoChart.data.datasets[1].data[i]['y'])){
				pushTo = 1
			} else if ((data['x'] < paretoChart.data.datasets[1].data[i]['x'] &&
						data['y'] < paretoChart.data.datasets[1].data[i]['y'])){
				pushTo = 0
				break
			}
		}
		
		paretoChart.data.datasets[pushTo].data.push(data)
		if(pushTo == 1){
			paretoChart.data.datasets[1].data.sort(compareData)
		}
	}

	paretoChart.update()
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
      },{
        label: 'Pareto Frontier',
        cubicInterpolationMode: 'monotone',
        borderColor: window.chartColors.blue,
        borderWidth: 2,
        fill: false,
        data: [],
        borderWidth: 2.5,
        tension: 1,
        showLine: true
      }]
    },
    options: {
      onClick: handleClick,
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
				onPan: function({chart}) { console.log(`I'm panning!!!`); },
				// Function called once panning is completed
				onPanComplete: function({chart}) { console.log(`I was panned!!!`); }
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
				onZoom: function({chart}) { console.log(`I'm zooming!!!`); },
				// Function called once zooming is completed
				onZoomComplete: function({chart}) { console.log(`I was zoomed!!!`); }
			}
		}
	},
      responsive: true,
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
              var prp = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['prp']
              var profit = data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['profit']
              return [['Battery Life: ' + data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['x'].toPrecision(2)],
              ['IRR: ' + data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']]['y'].toPrecision(2)],
              ['PRP: ' + (prp?prp:0)],
              ['Profit: '+ (profit?profit:0)]]
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
        text: 'Pareto Scatter Chart',
        fontSize: 30
      },
      scales: {
        xAxes: [{
          ticks: {
            fontSize: 15
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Remaining Battery Life (Year)',
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
  
  var ctx = document.getElementById("paretoChart").getContext("2d")
  paretoChart = new Chart.Scatter(ctx, config)
}
