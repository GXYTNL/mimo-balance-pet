# MiMo 桌面宠物

Windows + Android 双端的 MiMo / 大模型 API 余额桌面宠物。

- Windows 11：Electron + electron-builder，生成 EXE 安装包
- Android：原生 WebView + HTTP 桥接，生成 APK
- 点击宠物查询余额、拖动/触摸、互动气泡、余额面板
- API Key 只保存在本机，不写入仓库

## GitHub Actions

推送到 main 会自动构建：
- mimo-pet-windows-exe
- mimo-pet-android-apk

也可以在 Actions → Build MiMo Pet → Run workflow 手动运行。

## 安全

不要把真实 API Key 写进源码或 GitHub。若曾提交过真实 Key，请立即轮换。
