import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { spawn } from 'child_process'



// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (url) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }
}

let flaskPort: number | null = null
async function upServer() {
  console.log("upServer")

  const serverProcess = spawn('python', ["./server/server.py"])

  serverProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data.toString().trim()}`);
    const stdoutString: string = data.toString().trim()
    if (stdoutString.startsWith("status:::")){
      const status = stdoutString.split(":::")[1]

      if(status.startsWith("ポート確保済み:")){
        flaskPort = parseInt(status.trim().split(":")[1])
      }

      if(status === "完了"){
        win?.webContents.send('response-server-status', {status: status, url: `http://127.0.0.1:${flaskPort}`})
      }else{
        win?.webContents.send('response-server-status', {status: status})
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

app.whenReady().then(createWindow).then(upServer)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.on('will-quit', () => {
  // アプリケーションが終了する前にFlaskサーバープロセスを終了
  fetch(`http://127.0.0.1:${flaskPort}/quit`)
});