# Backend Setup Guide

This guide provides platform-specific instructions for setting up the ET Backend development environment.

## Windows Setup

### Prerequisites

- **Python 3.11** (recommended for guaranteed pandas wheel compatibility)
- Git for Windows

> **Important:** Python 3.11 is specifically recommended because pandas 2.2.2 has pre-built binary wheels for Python 3.11 on Windows, avoiding the need for Visual Studio build tools.

### Installation Steps

#### 1. Create Virtual Environment

Use Python 3.11 to create the virtual environment:

**If you have multiple Python versions:**
```cmd
cd et-backend
py -3.11 -m venv .venv
```

**If Python 3.11 is your default:**
```cmd
cd et-backend
python -m venv .venv
```

**Alternative with explicit Python 3.11 path:**
```cmd
cd et-backend
python3.11 -m venv .venv
```

#### 2. Activate Virtual Environment

**For Command Prompt (CMD):**
```cmd
.venv\Scripts\activate
```

**For PowerShell:**
```powershell
.venv\Scripts\Activate.ps1
```

> **Note:** If you encounter a PowerShell execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### 3. Configure pip for Virtual Environment

To ensure packages install to the virtual environment (not user site-packages), set the environment variable:

**For Command Prompt (CMD):**
```cmd
set PIP_USER=0
```

**For PowerShell:**
```powershell
$env:PIP_USER=0
```

Alternatively, you can set this permanently in Windows Environment Variables.

#### 4. Install Dependencies

```cmd
python -m pip install --no-user -r requirements.txt
```

The `--no-user` flag ensures packages install to `.venv\Lib\site-packages` instead of the user site-packages directory.

#### 5. Configure Environment Variables

Copy the example environment file and configure it:

```cmd
copy .env.example .env
```

Edit `.env` with your configuration values.

#### 6. Run the Development Server

Use the Python module syntax to run uvicorn:

```cmd
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Important:** On Windows, use `python -m uvicorn` instead of just `uvicorn` to ensure the virtual environment's uvicorn is used.

### Troubleshooting

#### pandas Installation Fails with Build Errors

If you encounter meson build errors or "Could not parse vswhere.exe output" when installing pandas, this means pip is trying to build pandas from source. The solution is to ensure you're using Python 3.11 with pre-built Windows wheels.

**Solution:**
- **Verify you're using Python 3.11**: Run `python --version` to confirm. pandas 2.2.2 has confirmed pre-built wheels (`cp311-cp311-win_amd64.whl`) for Python 3.11 on Windows.
- If you're using a different Python version, install Python 3.11 and recreate the virtual environment
- If the issue persists with Python 3.11, try installing pandas separately first:
  ```cmd
  python -m pip install --no-user --only-binary :all: pandas==2.2.2
  ```
- The `--only-binary :all:` flag forces pip to use pre-built wheels only, preventing source compilation

#### Packages Installing to Wrong Location

If packages are installing to `C:\Users\[username]\AppData\Roaming\Python\...` instead of `.venv\Lib\site-packages`:

**Solution:**
- Ensure `PIP_USER=0` is set before running pip install
- Use the `--no-user` flag with pip install
- Verify the virtual environment is activated (you should see `(.venv)` in your prompt)

#### uvicorn Command Not Found

If you get "uvicorn is not recognized as an internal or external command":

**Solution:**
- Always use `python -m uvicorn` instead of just `uvicorn`
- This ensures Python finds uvicorn in the virtual environment
- Verify the virtual environment is activated

## Linux/macOS Setup

### Prerequisites

- Python 3.11 or higher
- pip

### Installation Steps

#### 1. Create Virtual Environment

```bash
cd et-backend
python3 -m venv .venv
```

#### 2. Activate Virtual Environment

```bash
source .venv/bin/activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

#### 5. Run the Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker Setup

If you prefer to use Docker instead of a local Python installation:

### Prerequisites

- Docker
- Docker Compose

### Running with Docker Compose

From the project root directory:

```bash
docker-compose up backend
```

The backend will be available at `http://localhost:8000`.

### Building the Docker Image

```bash
cd et-backend
docker build -t et-backend .
```

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_windows_dependency_bug.py
```

### Run with Coverage

```bash
pytest --cov=app tests/
```

## Verification

After installation, verify everything is working:

1. Check Python version:
   ```bash
   python --version
   ```

2. Verify packages are installed in virtual environment:
   - **Windows:** Check `.venv\Lib\site-packages\` directory
   - **Linux/macOS:** Check `.venv/lib/python3.11/site-packages/` directory

3. Test imports:
   ```bash
   python -c "import fastapi, motor, pandas; print('All imports successful')"
   ```

4. Start the server and visit `http://localhost:8000/docs` to see the API documentation.
