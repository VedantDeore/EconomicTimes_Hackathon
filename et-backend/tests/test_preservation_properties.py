"""
Preservation Property Tests for Non-Windows Dependency Installation

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

CRITICAL: These tests MUST PASS on unfixed code - success confirms baseline behavior to preserve.
These tests verify that Linux, macOS, and Docker installations work correctly BEFORE the fix.

Property 2: Preservation - Non-Windows Installation Behavior

This test suite verifies that non-Windows installations (Linux, macOS, Docker) complete
successfully with all packages installed correctly. These tests establish the baseline
behavior that must be preserved after implementing the Windows fix.

EXPECTED OUTCOME ON UNFIXED CODE: Tests PASS (this confirms the baseline to preserve)
"""

import os
import platform
import subprocess
import sys
from pathlib import Path

import pytest


class TestPreservationProperties:
    """
    Preservation property tests for non-Windows dependency installation.
    
    These tests verify baseline behavior on Linux, macOS, and Docker that must
    remain unchanged after implementing the Windows fix.
    """

    @pytest.fixture
    def is_non_windows(self):
        """Check if running on non-Windows platform (Linux, macOS, etc.)."""
        return platform.system() != "Windows"

    @pytest.fixture
    def venv_path(self):
        """Get the virtual environment path."""
        return Path(__file__).parent.parent / ".venv"

    @pytest.fixture
    def site_packages_path(self, venv_path):
        """Get the expected site-packages path in virtual environment."""
        if platform.system() == "Windows":
            return venv_path / "Lib" / "site-packages"
        else:
            python_version = f"python{sys.version_info.major}.{sys.version_info.minor}"
            return venv_path / "lib" / python_version / "site-packages"

    def test_linux_macos_installation_completes_successfully(self, is_non_windows):
        """
        Test that Linux/macOS installations complete successfully with all packages.
        
        **Validates: Requirements 3.1**
        
        This test verifies that dependency installation works correctly on Linux and macOS
        systems. This baseline behavior must be preserved after the Windows fix.
        
        Expected outcome: All packages installed successfully
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        # Verify key packages are installed
        key_packages = [
            "fastapi",
            "uvicorn",
            "pandas",
            "motor",
            "beanie",
            "python-jose",
            "passlib",
            "google-generativeai",
            "PyPDF2",
            "pytest"
        ]
        
        for package in key_packages:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "show", package],
                capture_output=True,
                text=True,
                check=False
            )
            
            assert result.returncode == 0, \
                f"Package '{package}' is not installed on {platform.system()}\n" \
                f"This indicates a baseline installation issue that must be fixed"
            
            assert f"Name: {package}" in result.stdout, \
                f"Package '{package}' show output is malformed"

    def test_linux_macos_packages_in_virtual_environment(self, is_non_windows, venv_path, site_packages_path):
        """
        Test that packages are installed in the virtual environment on Linux/macOS.
        
        **Validates: Requirements 3.1**
        
        This test verifies that packages are correctly installed in the virtual environment
        site-packages directory, not in system or user locations.
        
        Expected outcome: All packages in .venv/lib/pythonX.Y/site-packages
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        # Check that virtual environment exists
        assert venv_path.exists(), \
            f"Virtual environment not found at {venv_path}"
        
        # Check that site-packages directory exists
        assert site_packages_path.exists(), \
            f"site-packages not found at {site_packages_path}"
        
        # Verify key packages are in venv site-packages
        key_packages = ["fastapi", "uvicorn", "pandas", "motor", "beanie"]
        
        for package in key_packages:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "show", package],
                capture_output=True,
                text=True,
                check=True
            )
            
            location_line = [line for line in result.stdout.split('\n') 
                           if line.startswith('Location:')]
            assert location_line, f"Could not find location for package '{package}'"
            
            location = location_line[0].split(':', 1)[1].strip()
            
            # Verify package is in the virtual environment
            assert str(site_packages_path) in location or ".venv" in location or "venv" in location, \
                f"Package '{package}' not in virtual environment\n" \
                f"Location: {location}\n" \
                f"Expected: {site_packages_path}"

    def test_docker_compose_build_succeeds(self):
        """
        Test that Docker Compose builds complete successfully.
        
        **Validates: Requirements 3.2**
        
        This test verifies that Docker-based installations work correctly.
        Docker builds must continue to work after the Windows fix.
        
        Expected outcome: Docker build completes without errors
        """
        # Check if docker-compose.yml exists
        docker_compose_path = Path(__file__).parent.parent.parent / "docker-compose.yml"
        
        if not docker_compose_path.exists():
            pytest.skip("docker-compose.yml not found, skipping Docker test")
        
        # Check if Docker is available
        try:
            subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                check=True,
                timeout=10
            )
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pytest.skip("Docker not available, skipping Docker test")
        
        # Check if Docker daemon is running
        try:
            subprocess.run(
                ["docker", "ps"],
                capture_output=True,
                check=True,
                timeout=10
            )
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pytest.skip("Docker daemon not running, skipping Docker test")
        
        # Try to build the backend service (don't run it, just build)
        try:
            result = subprocess.run(
                ["docker", "compose", "build", "backend"],
                capture_output=True,
                text=True,
                check=False,
                timeout=300,  # 5 minutes timeout for build
                cwd=docker_compose_path.parent
            )
            
            # Check if build succeeded
            assert result.returncode == 0, \
                f"Docker Compose build failed\n" \
                f"stdout: {result.stdout}\n" \
                f"stderr: {result.stderr}\n" \
                f"This indicates a baseline Docker build issue"
                
        except subprocess.TimeoutExpired:
            pytest.skip("Docker build timed out (may be downloading images)")

    def test_application_imports_work_correctly(self, is_non_windows):
        """
        Test that all application imports work correctly after installation.
        
        **Validates: Requirements 3.3**
        
        This test verifies that all required modules can be imported successfully.
        Import functionality must be preserved after the Windows fix.
        
        Expected outcome: All imports succeed without errors
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        # Test critical imports
        import_tests = [
            "import fastapi",
            "import uvicorn",
            "import pandas",
            "import motor",
            "import beanie",
            "from fastapi import FastAPI",
            "from motor.motor_asyncio import AsyncIOMotorClient",
            "from beanie import Document",
            "import pandas as pd",
            "from jose import jwt",
            "from passlib.context import CryptContext",
        ]
        
        for import_statement in import_tests:
            result = subprocess.run(
                [sys.executable, "-c", import_statement],
                capture_output=True,
                text=True,
                check=False
            )
            
            assert result.returncode == 0, \
                f"Import failed: {import_statement}\n" \
                f"Error: {result.stderr}\n" \
                f"This indicates a baseline import issue that must be fixed"

    def test_pytest_execution_works(self, is_non_windows):
        """
        Test that pytest tests can be executed with installed dependencies.
        
        **Validates: Requirements 3.4**
        
        This test verifies that the testing framework works correctly with
        the installed dependencies. Test execution must be preserved after the fix.
        
        Expected outcome: pytest can discover and run tests
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        # Verify pytest is installed and can run
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "--version"],
            capture_output=True,
            text=True,
            check=False
        )
        
        assert result.returncode == 0, \
            f"pytest is not working correctly\n" \
            f"Error: {result.stderr}\n" \
            f"This indicates a baseline pytest issue"
        
        assert "pytest" in result.stdout, \
            f"pytest version output is malformed: {result.stdout}"

    def test_pandas_version_correct(self, is_non_windows):
        """
        Test that pandas is installed at the correct version.
        
        **Validates: Requirements 3.1, 3.3**
        
        This test verifies that pandas 2.2.2 is installed correctly on non-Windows
        platforms. The version must remain consistent after the Windows fix.
        
        Expected outcome: pandas 2.2.2 is installed
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        result = subprocess.run(
            [sys.executable, "-m", "pip", "show", "pandas"],
            capture_output=True,
            text=True,
            check=True
        )
        
        version_line = [line for line in result.stdout.split('\n') 
                       if line.startswith('Version:')]
        assert version_line, "Could not find pandas version"
        
        version = version_line[0].split(':', 1)[1].strip()
        assert version == "2.2.2", \
            f"Expected pandas 2.2.2, got {version}\n" \
            f"Version must remain consistent across platforms"

    def test_uvicorn_executable_accessible(self, is_non_windows, venv_path):
        """
        Test that uvicorn is accessible after installation on Linux/macOS.
        
        **Validates: Requirements 3.1, 3.3**
        
        This test verifies that uvicorn can be executed on non-Windows platforms.
        This baseline behavior must be preserved after the Windows fix.
        
        Expected outcome: uvicorn command works correctly
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        # On Linux/macOS, uvicorn is in bin/ directory
        uvicorn_path = venv_path / "bin" / "uvicorn"
        
        if not uvicorn_path.exists():
            # Try using python -m uvicorn as fallback
            result = subprocess.run(
                [sys.executable, "-m", "uvicorn", "--version"],
                capture_output=True,
                text=True,
                check=False,
                timeout=10
            )
        else:
            result = subprocess.run(
                [str(uvicorn_path), "--version"],
                capture_output=True,
                text=True,
                check=False,
                timeout=10
            )
        
        assert result.returncode == 0, \
            f"uvicorn command failed\n" \
            f"stdout: {result.stdout}\n" \
            f"stderr: {result.stderr}\n" \
            f"This indicates a baseline uvicorn issue"
        
        # Verify output contains uvicorn version info
        output = result.stdout + result.stderr
        assert "uvicorn" in output.lower() or "running" in output.lower(), \
            f"uvicorn output is unexpected: {output}"

    def test_fastapi_application_can_import(self, is_non_windows):
        """
        Test that the FastAPI application can be imported successfully.
        
        **Validates: Requirements 3.3**
        
        This test verifies that the main application module can be imported,
        which requires all dependencies to be correctly installed.
        
        Expected outcome: app.main module imports successfully
        """
        if not is_non_windows:
            pytest.skip("This test only runs on non-Windows platforms (Linux, macOS)")

        # Try to import the main application
        app_path = Path(__file__).parent.parent / "app"
        
        if not app_path.exists():
            pytest.skip("app directory not found, skipping application import test")
        
        # Add app parent directory to Python path for import
        result = subprocess.run(
            [sys.executable, "-c", 
             f"import sys; sys.path.insert(0, '{app_path.parent}'); from app.main import app"],
            capture_output=True,
            text=True,
            check=False
        )
        
        assert result.returncode == 0, \
            f"Failed to import app.main\n" \
            f"Error: {result.stderr}\n" \
            f"This indicates a baseline application import issue"
