const electron = require("electron");
const path = require("path");
const url = require("url");

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow, resultWindow;

// SET ENV
process.env.NODE_ENV = 'development';

// create main window
function createWindow() {
    mainWindow = new BrowserWindow();
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));
    
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
}

function createResultWindow() {
    // resultWindow = new BrowserWindow({parent: mainWindow, modal: true, show: true});
    resultWindow = new BrowserWindow();
    resultWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'result.html'),
        protocol: 'file',
        slashes: true
    }));
    
    resultWindow.on('closed', () => {
        resultWindow = null;
    });

}

// create menu template
const mainMenuTemplate = [
    {
        label: 'App',
        submenu: [
            {
                label: 'Reset',
                click() {console.log('Hit reset!');}
            },
            {
                label: 'Quit Application',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {app.quit();}
            }
        ]
    }, {
        label: 'Build', 
        submenu: [
            {
                label: 'Run',
                accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
                click() {
                    // createResultWindow();
                    mainWindow.webContents.send('gotoResult');
                }
            },{
                label: 'Stop'
            }
        ]
    }
];

// Add dev tools if not in prod
if(process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Dev',
        submenu: [
            {
                label: 'Inspector',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.openDevTools();
                }
            }
        ]
    });
}


// when first start the app
app.on('ready', createWindow);

// when closing the app
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
  if(mainWindow === null) {
      createWindow();
  }
});

// Enable live reload for Electron too
require('electron-reload')(__dirname, {
    // Note that the path to electron may vary according to the main file
    electron: require(`${__dirname}/node_modules/electron`)
});