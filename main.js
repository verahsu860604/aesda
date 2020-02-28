const electron = require("electron")
const path = require("path")
const url = require("url")

const {app, BrowserWindow, Menu} = electron
const ipc = electron.ipcMain

let mainWindow, marketWindow, essWindow

// SET ENV
process.env.NODE_ENV = 'development'

// create windows
function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        height: 800,
        width: 1200
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/index.html'),
        protocol: 'file',
        slashes: true
    }))
    
    mainWindow.on('closed', () => {
        mainWindow = null
        app.quit()
    })

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
}

// args = [marketType, marketObjData]
function createMarketWindow(args) {
    marketWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
        },
    })
    marketWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/market.html'),
        protocol: 'file',
        slashes: true
    }))
    
    marketWindow.on('closed', () => {
        marketWindow = null
    })

    marketWindow.webContents.on('did-finish-load', () => {
        marketWindow.webContents.send('marketType', args)
    })
}

function createEssWindow(args) {
    essWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true
        },
    })
    essWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/ess.html'),
        protocol: 'file',
        slashes: true
    }))
    
    essWindow.on('closed', () => {
        essWindow = null
    })

    essWindow.webContents.on('did-finish-load', () => {
        essWindow.webContents.send('essType', args)
    })
}

// ipc
ipc.on('createMarketWindow', (event, args) => {
    createMarketWindow([args, ''])
})

ipc.on('createEssWindow', (event, args) => {
    createEssWindow(args, -1, '')
})

ipc.on('marketObj', (event, args) => {
    mainWindow.webContents.send('marketObj', args)
})

ipc.on('essObj', (event, args) => {
    mainWindow.webContents.send('essObj', args)
})

ipc.on('editMarketObj', (event, args) => {
    createMarketWindow(args)
})

ipc.on('editEsstObj', (event, args) => {
    createEssWindow(args)
})


// create menu template
const mainMenuTemplate = [
    {
        label: 'App',
        submenu: [
            {
                label: 'Reset',
                click() {console.log('Hit reset!')}
            },
            {
                label: 'Quit Application',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {app.quit()}
            }
        ]
    }, {
        label: 'Build', 
        submenu: [
            {
                label: 'Run',
                accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
                click() {
                    createResultWindow()
                    // mainWindow.webContents.send('gotoResult')
                }
            },{
                label: 'Stop'
            }
        ]
    }
]



// Add dev tools if not in prod
if(process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Dev',
        submenu: [
            {
                label: 'Inspector',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.openDevTools()
                }
            }
        ]
    })
}

// when first start the app
app.on('ready', createWindow)

// when closing the app
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
  if(mainWindow === null) {
      createWindow()
  }
})

// Enable live reload for Electron too
require('electron-reload')(__dirname, {
    // Note that the path to electron may vary according to the main file
    electron: require(`${__dirname}/node_modules/electron`)
})