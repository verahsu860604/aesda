const electron = require("electron")
const path = require("path")
const url = require("url")
const strMap = require("../js/string.js")

const {BrowserWindow} = electron.remote
const ipc = electron.ipcRenderer

let marketObjList = {}

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
    if(curEss !== undefined) ipc.send("createEssWindow", curEss)
})

// ipc
ipc.on('marketObj', (event, args) => {
    var marketType = args[0]
    var marketData = args[1]
    
    if(marketType in marketObjList) {
        marketObjList[marketType] = marketData
        editMarketElem(marketData)
    }else {
        marketObjList[marketType] = marketData
        createMarketElem(args) 
    }
    console.log(marketObjList)
})

ipc.on('essObj', (event, args) => {
    createEssElem(args)
})

// create market element
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
    
    var card = createElement('div', 'class=card mb-3')

    for(var i = 0; i < marketData.length; i++) {
        var p = createElement('p')
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

// edit market element
function editMarketElem(marketData) {
    var i = 0
    var pObject = document.querySelectorAll('p')
    marketData.forEach(e => {
        pObject[i++].innerHTML = strMap.miStrMap(e['name']) + ": " + e['value']
    })
}

// create ess element
function createEssElem(args) {

    var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm', 'essEditBtn')
    editbtn.innerHTML = 'Edit'
    var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
    deletebtn.innerHTML = 'Delete'
    
    var cardBody = createElement('div', 'class=card-body')
    var cardHead = createElement('H5', 'class=card-header')
    var cardHeadText = document.createTextNode(args[0])
    cardHead.appendChild(cardHeadText)

    var card = createElement('div', 'class=card mb-3')
    var cardiv = createElement('div', 'class=col-sm-4')
    
    for(var i = 0; i < args[1].length; i++) {
        var p = createElement('p')
        p.innerHTML = strMap.eiStrMap(args[1][i]['name']) + ": " + args[1][i]['value']
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

}

// creating elements
function createElement(type, ...args) {
    var ele = document.createElement(type)
    for(var i = 0; i < args.length; i++) {
        var kv = args[i].split('=')
        ele.setAttribute(kv[0], kv[1])
    }
    return ele
}