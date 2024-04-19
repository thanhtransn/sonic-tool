const { updateElectronApp, UpdateSourceType } = require('update-electron-app');
const path = require("path");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const { tool } = require("./features/tool");
const { verifyUser } = require("./utils/auth");
const DateTime = require("luxon").DateTime;
const Database = require("./configurations/database.config");
const { extractTime } = require("./utils/helper");
const EnvConfiguration = require("./configurations/global.config");
/* auto update*/
updateElectronApp({
  updateSource: {
    host: 'https://update.electronjs.org',
    type: UpdateSourceType.ElectronPublicUpdateService,
    repo: 'thanhtransn/sonic-tool'
  },
  updateInterval: '1 hour',
  logger: require('electron-log')
})

const env = EnvConfiguration.getEnv();

const db = new Database({ url: env.mongo_uri });
db.getInstance();

const isDev = env.node_env !== "production";
const isMac = process.platform === "darwin";
const localStorage = new Map();

let mainWindow;
let aboutWindow;

// Main Window
function createMainWindow(page) {
  mainWindow = new BrowserWindow({
    width: isDev ? 1000 : 800,
    height: 600,
    icon: `${__dirname}/assets/icons/icons8-sonic-256.png`,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "configurations/preload.js"),
    },
  });

  // Show devtools automatically if in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);
  mainWindow.loadFile(path.join(__dirname, `${page}`));
}

// About Window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: "About Electron",
    icon: `${__dirname}/assets/icons/icons8-sonic-256.png`,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}
function renderPage(page) {
  mainWindow.loadFile(path.join(__dirname, `${page}`));
}
// When the app is ready, create the window
app.on("ready", () => {
  createMainWindow("renderer/compoments/_auth/index.html");

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove variable from memory
  mainWindow.on("closed", () => (mainWindow = null));
});

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

// Respond to the resize image event
ipcMain.on("data:verify", async (e, options) => {
  const operateAt = DateTime.now();
  const signInDate = localStorage.get("signin");
  if (Math.round(extractTime(signInDate, operateAt, "hours")) >= 24) {
    renderPage("renderer/compoments/_auth/index.html");
    return;
  }
  return await tool(options, mainWindow, shell);
});

ipcMain.on("signin", async (e, email) => {
  const data = await verifyUser(email).catch((e) => {
    mainWindow.send("process:error", e.message);
  });
  if (data) {
    renderPage("renderer/compoments/_tooling/index.html");

    localStorage.set(
      "signin",
      `${DateTime.now().toISO({ includeOffset: true })}`
    );
    if (data < 30) {
      setTimeout(function () {
        mainWindow.send(
          "process:warning",
          `Account Will Be Expired In ${data} days`
        );
      }, 3000);
    }
    return;
  }
});
// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});

// Open a window if none are open (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
