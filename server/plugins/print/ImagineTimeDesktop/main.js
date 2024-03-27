// Modules to control application life and create native browser window
const {
  app, BrowserWindow, ipcMain, session, Menu, shell,
} = require('electron')
const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')
const os = require('os')
const path = require('path')
const args = require('minimist')(process.argv)

// TODO: Get this from the packager and switch for each env
const domain = 'app.imaginetime.com'
const endpoint = 'https://app.imaginetime.com'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// Keep a global reference to the print file for uploading
let printFilename

// Remove the default application menu (mostly for Windows)
Menu.setApplicationMenu(false);
createLog('APP Started');

const createWindow = () => {
  createLog('Createwindow args ' + args.f);
  if (args.f) {
    // eslint-disable-next-line prefer-destructuring
    printFilename = args.f

    // IPC listener to check if there is a file to upload
    ipcMain.on('print-file-ready', (event, data) => {
      mainWindow.webContents.send('print-file-status', {
        printFile: true,
      })
    })

    // IPC listener to upload the file
    ipcMain.on('print-file-upload', (event, data) => {
      createLog('print-file-upload ');
      const formData = new FormData()

      formData.append(
        '0',
        fs.createReadStream(printFilename),
        data.filename || 'file',
      )
      formData.append('_firm', data.firmId)
      formData.append('status', data.status)

      if (data.clientId) {
        formData.append('_client', data.clientId)
      }

        session.defaultSession.cookies.get({ domain: domain})
        .then((cookies) => fetch(`${endpoint}/api/files`, {
          method: 'POST',
          body: formData,
          headers: {
            cookie: `connect.sid=${cookies.find((cookie) => cookie.name === 'connect.sid').value}`,
          },
        }))
        .then((result) => result.json())
        .then((json) => {
          console.log(json)
        })
        .catch((error) => {
          console.log(error)
        })
    })
  }

  // HACK: there are some windows that doesnt display the app

      createLog('Create BrowserWindow');
    // Create the browser window.
      mainWindow = new BrowserWindow({
      alwaysOnTop: true,
      width: 800,
      height: 600,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js'),
      },
    })

    // Load the remote application
    mainWindow.loadURL(`${endpoint}/desktop`)

    // Load default page if not connected
    mainWindow.webContents.on('did-fail-load', () => {
      mainWindow.loadURL(`file://${__dirname}/index.html`)
    })

    // Open external links with _target=blank in a browser window
    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault()
      shell.openExternal(url)
    })

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
      createLog('Window closed');
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
    })
  }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.removeAllListeners('ready')
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  createLog('Windows all close');
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  createLog('Activated');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

function createLog(log)
{
  const path = os.tmpdir() + '/imaginelog.txt';
  fs.appendFileSync(path, "ELECTRON:" + log + '\n');
}
