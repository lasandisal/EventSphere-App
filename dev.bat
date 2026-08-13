@echo off
setlocal EnableExtensions

REM =========================================================
REM EventSphere Frontend Local Development Startup Script
REM 1. Generates js/env.js from .env
REM 2. Starts Python's static HTTP server
REM 3. Cleans up the process listening on the configured port
REM =========================================================

REM Change directory to repo root
cd /d "%~dp0"

REM Step 1: Generate js/env.js
echo.
echo Generating frontend environment configuration...
python scripts\generate_env.py

if errorlevel 1 (
    echo.
    echo ERROR: Failed to generate js/env.js.
    exit /b 1
)

REM Step 2: Read PORT from .env or default to 8000
set "PORT=8000"

if exist ".env" (
    for /f "tokens=1,* delims==" %%A in ('findstr /b "PORT=" .env') do (
        if not "%%B"=="" set "PORT=%%B"
    )
)

REM Remove possible quotes, apostrophes, spaces and CR artifacts
set "PORT=%PORT:"=%"
set "PORT=%PORT:'=%"
set "PORT=%PORT: =%"

REM Step 3: Verify Python is available
where python >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: Python was not found on PATH.
    echo Please install Python and make sure python.exe is available.
    exit /b 1
)

REM Step 4: Print startup banner
echo.
echo =========================================================
echo EventSphere frontend starting...
echo URL:  http://127.0.0.1:%PORT%
echo Port: %PORT%
echo Press Ctrl+C to stop the server.
echo =========================================================
echo.

REM Step 5: Start Python HTTP server
python -m http.server %PORT% --bind 127.0.0.1

REM Step 6: Python server has exited
echo.
echo Frontend server has exited.
echo Checking port %PORT%...
echo.

REM Step 7: Find processes listening on the configured port
set "FOUND_PROCESS=0"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    set "FOUND_PROCESS=1"

    echo Found process %%P listening on port %PORT%.
    echo Stopping process tree...

    taskkill /PID %%P /T /F >nul 2>&1

    if errorlevel 1 (
        echo WARNING: Could not terminate process %%P.
    ) else (
        echo Process %%P terminated successfully.
    )
)

REM Step 8: Verify port is actually free
if "%FOUND_PROCESS%"=="0" (
    echo No process was listening on port %PORT%.
) else (
    echo.
    echo Verifying port %PORT% is released...

    timeout /t 1 /nobreak >nul

    netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>&1

    if errorlevel 1 (
        echo Port %PORT% released successfully.
    ) else (
        echo WARNING: Port %PORT% is still in use.
        echo Run:
        echo     netstat -ano ^| findstr :%PORT%
    )
)

echo.
echo Frontend stopped.
echo.

endlocal