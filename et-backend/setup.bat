@echo off
REM ET Backend Windows Setup Script
REM This script automates the setup process for Windows developers using Python 3.11

echo ========================================
echo ET Backend Windows Setup (Python 3.11)
echo ========================================
echo.

REM Check if Python 3.11 is available
py -3.11 --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Python 3.11 not found via 'py -3.11'
    echo Attempting to use default Python...
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python is not installed or not in PATH
        echo Please install Python 3.11 from https://www.python.org/
        pause
        exit /b 1
    )
    set PYTHON_CMD=python
) else (
    echo Python 3.11 found
    set PYTHON_CMD=py -3.11
)

echo [1/6] Checking Python version...
%PYTHON_CMD% --version

REM Check if virtual environment exists
if exist ".venv\" (
    echo [2/6] Virtual environment already exists
) else (
    echo [2/6] Creating virtual environment with Python 3.11...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
)

REM Activate virtual environment
echo [3/6] Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Set PIP_USER to prevent user site-packages installation
echo [4/6] Configuring pip...
set PIP_USER=0

REM Install dependencies
echo [5/6] Installing dependencies...
echo This may take a few minutes...
python -m pip install --no-user --upgrade pip
python -m pip install --no-user -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo.
    echo Troubleshooting:
    echo - Ensure you are using Python 3.11 (pandas 2.2.2 has pre-built wheels for Python 3.11)
    echo - If pandas fails to build, try: python -m pip install --no-user --only-binary :all: pandas==2.2.2
    echo - See SETUP.md for more troubleshooting steps
    pause
    exit /b 1
)

REM Check if .env exists
echo [6/6] Checking environment configuration...
if exist ".env" (
    echo .env file already exists
) else (
    if exist ".env.example" (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo Please edit .env with your configuration values
    ) else (
        echo WARNING: .env.example not found
        echo You may need to create .env manually
    )
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env with your configuration values
echo 2. Run the development server:
echo    python -m uvicorn app.main:app --reload
echo.
echo To activate the virtual environment in the future:
echo    .venv\Scripts\activate
echo.
pause
