# Bugfix Requirements Document

## Introduction

The Python backend dependency installation fails on Windows systems due to three distinct issues: pandas build failure from missing Visual Studio build tools, pip installing packages to user site-packages instead of the virtual environment, and uvicorn command not being accessible after installation. These issues prevent developers from setting up the backend development environment on Windows, blocking local development and testing.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN installing pandas 2.2.2 on Windows without Visual Studio build tools THEN the system fails with meson error "Could not parse vswhere.exe output" and installation aborts

1.2 WHEN running pip install in an activated .venv on Windows THEN the system installs packages to user site-packages instead of the virtual environment directory

1.3 WHEN running uvicorn command after installation in .venv on Windows THEN the system reports "command not found" or "uvicorn is not recognized"

### Expected Behavior (Correct)

2.1 WHEN installing pandas 2.2.2 on Windows without Visual Studio build tools THEN the system SHALL install a pre-built binary wheel without requiring compilation

2.2 WHEN running pip install in an activated .venv on Windows THEN the system SHALL install packages to the .venv/Lib/site-packages directory

2.3 WHEN running uvicorn command after installation in .venv on Windows THEN the system SHALL execute uvicorn from .venv/Scripts/uvicorn.exe successfully

### Unchanged Behavior (Regression Prevention)

3.1 WHEN installing dependencies on Linux or macOS systems THEN the system SHALL CONTINUE TO install all packages successfully without modification

3.2 WHEN running the backend via Docker Compose THEN the system SHALL CONTINUE TO build and run without dependency issues

3.3 WHEN using the installed packages in the application code THEN the system SHALL CONTINUE TO import and execute all modules (FastAPI, Motor, Beanie, pandas, etc.) correctly

3.4 WHEN running pytest tests THEN the system SHALL CONTINUE TO execute all tests with the installed dependencies
