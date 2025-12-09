@echo off
echo Iniciando servidores...
start "Servidor HTTP (4040)" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 1 /nobreak >nul
start "Servidor WebSocket (4041)" cmd /k "cd /d %~dp0 && node server-websocket.js"
timeout /t 3 /nobreak >nul
echo Abriendo navegador...
start http://localhost:4040
echo Listo! Servidores iniciados.

