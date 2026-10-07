const { app, BrowserWindow, ipcMain, screen, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null, tray = null;
let dragState = null;
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

/* ---------- 设置读写（存本地 JSON） ---------- */
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); }
  catch { return {}; }
}
function saveSettings(data) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(data, null, 2));
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: 460,
    height: 620,
    x: width - 560,
    y: height - 700,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');   // 比普通置顶更"贴脸"
  win.loadFile('index.html');
}

/* ---------- 系统托盘（有 icon.png 才显示） ---------- */
function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  if (!fs.existsSync(iconPath)) return;
  tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }));
  tray.setToolTip('MiMo 桌面宠物');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '查询余额', click: () => win.webContents.send('pet:do-query') },
    { label: '显示 / 隐藏', click: () => (win.isVisible() ? win.hide() : win.show()) },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]));
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()));
}

/* ---------- IPC ---------- */
// 拖动宠物 = 移动整个无边框窗口（这样点击事件仍能传到宠物身上）
ipcMain.on('win:drag-start', () => {
  dragState = { cursor: screen.getCursorScreenPoint(), win: win.getPosition() };
});
ipcMain.on('win:drag-move', () => {
  if (!dragState) return;
  const c = screen.getCursorScreenPoint();
  win.setPosition(
    dragState.win[0] + (c.x - dragState.cursor.x),
    dragState.win[1] + (c.y - dragState.cursor.y)
  );
});
ipcMain.on('win:drag-end', () => { dragState = null; });

ipcMain.handle('win:hide-to-edge', () => {
  const [x, y] = win.getPosition();
  win.setPosition(-win.getBounds().width + 90, y);   // 只露出一小条
});
ipcMain.handle('win:restore', () => {
  const [x, y] = win.getPosition();
  if (x < 0) win.setPosition(20, y);
  win.show();
});
ipcMain.on('win:quit', () => app.quit());
ipcMain.handle('win:open-external', (e, url) => shell.openExternal(url));

// 由主进程发 HTTP 请求 —— 彻底绕开浏览器跨域限制
ipcMain.handle('http:request', async (e, { url, method = 'GET', headers = {}, body = null }) => {
  try {
    const res = await fetch(url, { method, headers, body });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 2000) };
  } catch (err) {
    return { ok: false, status: 0, json: null, text: String(err.message || err) };
  }
});

ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('settings:set', (e, data) => { saveSettings(data); return true; });

/* ---------- 生命周期 ---------- */
app.whenReady().then(() => { createWindow(); createTray(); });
app.on('window-all-closed', () => app.quit());