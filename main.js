const electron = require("electron")
const path = require("path")
const url = require("url")

const {app, BrowserWindow, Menu} = electron
const ipc = electron.ipcMain
const {PythonShell} = require('python-shell') 

let mainWindow, marketWindow, essWindow

// process.on('uncaughtException', (err) => {
//     console.log(err)
// })
// SET ENV
// process.env.NODE_ENV = 'development'
process.env.NODE_ENV = 'production'

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

var pyshell;

ipc.on('run', (event, args) => {
    let options = {
        // machine specific
        // pythonPath: 'C:/Users/cjyan/Anaconda3/python.exe',
        args: [JSON.stringify(args)]
    }
    let tottimestamp = args.configForm[args.configForm.length-1].value
    
    pathToPythonScript = path.join(__dirname, 'algo/algo.py');
    console.log(pathToPythonScript);
    pyshell = new PythonShell(pathToPythonScript, options, {});
    
    // pyshell = new PythonShell('algo/algo.py', options, {});

    let totl = 1
    let cnt = 0
    pyshell.on('message', function (message) {
        
        if (message.substring(0, 12) == 'START TIME: ') {
            console.log(message)
            mainWindow.webContents.send('startTime', message.split(': ')[1])
        }
        // received a message sent from the Python script (a simple "print" statement)
        if (message.substring(0, 6) == 'totl: ') {
            totl = parseInt(message.substring(6, message.length), 10)
            console.log('TOTL: ' + totl)
        }
        else if (message.substring(0, 7) == 'DEBUG: ') {
            if (message.substring(13,22) == 'timestamp') {
                timestamp = parseInt(message.substring(24,32).split(' ')[0], 10)
                if(timestamp % 100 == 10){
                    new_progress = 0 + 100 * (cnt / totl + (timestamp / tottimestamp) * (1/totl))
                    mainWindow.webContents.send('updateProgressBarFast', [new_progress])
                }
            }
            console.log(message)
        }
        else if (message.indexOf('license') !== -1) {
            console.log(message)
        }
        else if(message.indexOf('id') !== -1){
            while(message.indexOf('Long-step') !== -1){
                message = message.replace('Long-step dual simplex will be used', '')
            }
            data = JSON.parse(message)
            cnt = data['id']
            new_progress = Math.round( 0 + 100 * cnt / totl )
            // console.log(data)
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


// create menu template
const mainMenuTemplate = [
    {
        label: 'App',
        submenu: [
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
            }
        ]
    }, {
        label: 'Help', 
        submenu: [
            {
                label: 'User Manual',
                click() {
                    electron.shell.openExternal('https://hackmd.io/@wjNrd-H4TUazkUk6gQ-OPw/Bkmqu53O8')
                }
            },{
                label: 'Github',
                click() {
                    electron.shell.openExternal('https://github.com/verahsu860604/aesda')
                }
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
    
// Enable live reload for Electron too
    require('electron-reload')(__dirname, {
        // Note that the path to electron may vary according to the main file
        electron: require(`${__dirname}/node_modules/electron`)
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
// require('electron-reload')(__dirname, {
//     // Note that the path to electron may vary according to the main file
//     electron: require(`${__dirname}/node_modules/electron`)
// })
