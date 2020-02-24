const electron = require("electron");
const path = require("path");
const url = require("url");

const {BrowserWindow} = electron.remote
const ipc = electron.ipcRenderer;


// Dropdown control
var curMarket;
document.querySelectorAll("#market .dropdown-item").forEach((node) => {
    node.addEventListener('click', function(e){
        curMarket = e['toElement']['text'];
        document.querySelector("#market #dropdownMenuLink").innerHTML = curMarket;
    })
}) 

var curEss;
document.querySelectorAll("#ess .dropdown-item").forEach((node) => {
    node.addEventListener('click', function(e){
        curEss = e['toElement']['text'];
        document.querySelector("#ess #dropdownMenuLink").innerHTML = curEss;
    })
}) 

// buttons control
document.querySelector("#marketBtn").addEventListener('click', function() {
    if(curMarket !== undefined) ipc.send("createMarketWindow", curMarket);
})

document.querySelector("#essBtn").addEventListener('click', function() {
    if(curEss !== undefined) ipc.send("createEssWindow", curEss);
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
    
    var cardBody = document.createElement("div")
    cardBody.setAttribute('class', 'card-body')

    var cardHead = document.createElement('H5')
    var cardHeadText = document.createTextNode(args[0])
    cardHead.setAttribute('class', 'card-header')
    cardHead.appendChild(cardHeadText)
    
    var card = document.createElement("div")
    card.setAttribute('class', 'card mb-3')
    
    card.appendChild(cardHead)
    card.appendChild(cardBody)
    document.getElementById('markets').appendChild(card)

}

function createEssObject(args) {

    var cardBody = document.createElement("div")
    cardBody.setAttribute('class', 'card-body')

    var cardHead = document.createElement('H5')
    var cardHeadText = document.createTextNode(args[0])
    cardHead.setAttribute('class', 'card-header')
    cardHead.appendChild(cardHeadText)
    
    var card = document.createElement("div")
    card.setAttribute('class', 'card mb-3')

    var cardiv = document.createElement("div")
    cardiv.setAttribute('class', 'col-sm-4')

    var essdisplay = document.getElementById('esss')
    
    if(essdisplay.childElementCount === 0 || (essdisplay.lastElementChild !== null && essdisplay.lastElementChild.childElementCount === 3)){
        var row = document.createElement("div")
        row.setAttribute('class', 'row')
        essdisplay.appendChild(row);   
    }
    
    console.log(essdisplay)

    card.appendChild(cardHead)
    card.appendChild(cardBody)
    cardiv.appendChild(card)
    essdisplay.lastElementChild.appendChild(cardiv)

}

{/* <div class="card">
  <h5 class="card-header">Featured</h5>
  <div class="card-body">
    <h5 class="card-title">Special title treatment</h5>
    <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div> */}

