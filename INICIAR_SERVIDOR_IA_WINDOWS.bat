@echo off
setlocal
cd /d %~dp0
if "%OPENAI_API_KEY%"=="" (
  echo.
  echo Falta configurar OPENAI_API_KEY en Windows.
  echo No escriba la clave dentro de los archivos del SIAPE.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando componentes del servidor por unica vez...
  call npm install
)
echo Iniciando SIAPE con IA en el puerto 3000...
call npm start
pause
