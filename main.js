const electron = require("electron")
const path = require("path")
const url = require("url")

const {app, BrowserWindow, Menu} = electron
const ipc = electron.ipcMain
const {PythonShell} = require('python-shell') 

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

    // PythonShell.run('algo.py', null, function (err, results) {
    //     if (err) {
    //         console.log('ERROR!');
    //         throw err;
    //     }
    //     console.log('finished');
    //     console.log(results)
    // });

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    if(process.platform === 'darwin') Menu.setApplicationMenu(mainMenu)
    else mainWindow.setMenu(mainMenu)
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

function createDatapointWindow(args) {
    datapointWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true
        },
    })
    datapointWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/datapoint.html'),
        protocol: 'file',
        slashes: true
    }))
    
    datapointWindow.on('closed', () => {
        datapointWindow = null
    })
    datapointWindow.webContents.on('did-finish-load', () => {
        datapointWindow.webContents.send('datapoint', args)
    })

}

// ipc
ipc.on('createMarketWindow', (event, args) => {
    createMarketWindow([args, ''])
})

ipc.on('createEssWindow', (event, args) => {
    var essType = args[0]
    var essObjNum = args[1]
    createEssWindow([essType, essObjNum[essType]+1, ''])
})

ipc.on('submitMarketObj', (event, args) => {
    mainWindow.webContents.send('createMarketObj', args)
})

ipc.on('submitEssObj', (event, args) => {
    mainWindow.webContents.send('createEssObj', args)
})

ipc.on('editMarketObj', (event, args) => {
    createMarketWindow(args)
})

// args = [essType, essId, essObjList[essType][essId]]
ipc.on('editEsstObj', (event, args) => {
    createEssWindow(args)
})

ipc.on('run', (event, args) => {
    let options = {
        // machine specific
        // pythonPath: 'C:/Users/cjyan/Anaconda3/python.exe',
        args: [JSON.stringify(args)]
    }
    
    let pyshell = new PythonShell('algo/algo.py', options, {});

    let totl = 1
    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        if (message.substring(0, 6) == 'totl: ') {
            totl = parseInt(message.substring(6, message.length), 10)
            console.log('TOTL: ' + totl)
        }
        if(message.indexOf('id') !== -1){
            while(message.indexOf('Long-step') !== -1){
                message = message.replace('Long-step dual simplex will be used', '')
            }
            data = JSON.parse(message)
            cnt = data['id']
            new_progress = Math.round( 10 + 90 * cnt / totl )
            mainWindow.webContents.send('updateProgressBar', [new_progress, data])
            
        }
    });
    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
      if (err) throw err;
      console.log('The exit code was: ' + code);
      console.log('The exit signal was: ' + signal);
      console.log('finished');
      mainWindow.webContents.send('doneProgressBar')
    });
    // PythonShell.run('algo/algo.py', options, function (err, results) {
    //     if (err) {
    //         console.log('ERROR!')
    //         throw err;
    //     }
    //     console.log('finished')
    //     console.log(results)
    // });
})

ipc.on('dataPointClick', (event, args) => {
    createDatapointWindow(args)
})
ipc.on('compareData', (event, args) => {
    mainWindow.webContents.send('addDataToCompare', args)
})

// create menu template
const mainMenuTemplate = [
    {
        label: 'App',
        submenu: [
            {
                label: 'Reset',
                // click() {console.log('Hit reset!')}
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
                    mainWindow.webContents.send('generateResult')
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
