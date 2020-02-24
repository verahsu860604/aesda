const electron = require("electron")
const path = require("path")
const url = require("url")

const {BrowserWindow} = electron.remote
const ipc = electron.ipcRenderer


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
    createMarketObject(args)
})

ipc.on('essObj', (event, args) => {
    createEssObject(args)
})

// create market object
function createMarketObject(args) {
    
    var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm')
    editbtn.innerHTML = 'Edit'
    var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
    deletebtn.innerHTML = 'Delete'

    var cardBody = createElement('div', 'class=card-body')
    var cardHead = createElement('H5', 'class=card-header')
    var cardHeadText = document.createTextNode(args[0])
    cardHead.appendChild(cardHeadText)
    
    var card = createElement('div', 'class=card mb-3')
    
    cardBody.appendChild(editbtn)
    cardBody.appendChild(deletebtn)
    card.appendChild(cardHead)
    card.appendChild(cardBody)
    document.getElementById('markets').appendChild(card)
}

// create ess object
function createEssObject(args) {

    var editbtn = createElement('button', 'type=button', 'class=btn btn-light btn-sm')
    editbtn.innerHTML = 'Edit'
    var deletebtn = createElement('button', 'type=button', 'class=btn btn-danger btn-sm')
    deletebtn.innerHTML = 'Delete'
    
    var cardBody = createElement('div', 'class=card-body')
    var cardHead = createElement('H5', 'class=card-header')
    var cardHeadText = document.createTextNode(args[0])
    cardHead.appendChild(cardHeadText)

    var card = createElement('div', 'class=card mb-3')
    var cardiv = createElement('div', 'class=col-sm-4')
    
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