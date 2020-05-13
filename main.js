"use strict";

const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow = null;
let react = null;

const startReactSubprocess = () => {
  react = require("child_process").spawn("npm.cmd", ["run", "node_start"]);
  react.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  react.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  react.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
 
};

const killReactSubprocess = main_pid => {
  const script_name = "npm run node_start";
  let cleanup_completed = false;
  const psTree = require("ps-tree");
  psTree(main_pid, function(err, children) {
    let react_pid = children
      .filter(function(el) {
        return el.COMMAND == script_name;
      })
      .map(function(p) {
        return p.PID;
      });
    // kill all the spawned react processes
    react_pid.forEach(function(pid) {
      process.kill(pid);
    });
    react = null;
    cleanup_completed = true;
  });
  return new Promise(function(resolve, reject) {
    (function waitForSubProcessCleanup() {
      if (cleanup_completed) return resolve();
      setTimeout(waitForSubProcessCleanup, 30);
    })();
  });
};

const createMainWindow = () => {
  // Create the browser mainWindow
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // transparent: true, // transparent header bar
    // fullscreen: true,
    // opacity:0.8,
    darkTheme: true,
    // frame: false,
    resizeable: true
  });

  // Load the index page
  mainWindow.loadURL("http://localhost:8080/");

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the mainWindow is closed.
  mainWindow.on("closed", function() {
    // Dereference the mainWindow object
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function() {
  // start the backend server
  startReactSubprocess();
  createMainWindow();
});

// disable menu
app.on("browser-window-created", function(e, window) {
  window.setMenu(null);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    let main_process_pid = process.pid;
    killReactSubprocess(main_process_pid).then(() => {
      app.quit();
    });
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (subpy == null) {
    startReactSubprocess();
  }
  if (win === null) {
    createWindow();
  }
});

app.on("quit", function() {
  // do some additional cleanup
});