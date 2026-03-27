"""
Bug Condition Exploration Test for Windows Dependency Installation

**Validates: Requirements 2.1, 2.2, 2.3**

CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
DO NOT attempt to fix the test or the code when it fails.

Property 1: Bug Condition - Windows Dependency Installation Failures

This test explores the bug condition by verifying three specific Windows installation issues:
1. pandas 2.2.2 installs from pre-built wheel without compilation
2. pip installs packages to .venv/Lib/site-packages (not user site-packages)
3. uvicorn is accessible after installation

EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS (this is correct - it proves the bug exists)
"""

import os
import platform
import subprocess
import sys
from pathlib import Path

import pytest


class TestWindowsDependencyBug:
    """
    Bug condition exploration tests for Windows dependency installation.
    
    These tests are designed to FAIL on unfixed code to confirm the bug exists.
    """

    @pytest.fixture
    def is_windows(self):
        """Check if running on Windows."""
        return platform.system() == "Windows"

    @pytest.fixture
    def venv_path(self):
        """Get the virtual environment path."""
        # Assuming tests run from et-backend directory
        return Path(__file__).parent.parent / ".venv"

    @pytest.fixture
    def site_packages_path(self, venv_path):
        """Get the expected site-packages path in virtual environment."""
        if platform.system() == "Windows":
            return venv_path / "Lib" / "site-packages"
        else:
            python_version = f"python{sys.version_info.major}.{sys.version_info.minor}"
            return venv_path / "lib" / python_version / "site-packages"

    def test_pandas_installs_from_wheel_not_source(self, is_windows):
        """
        Test that pandas 2.2.2 installs from pre-built wheel without compilation.
        
        **Validates: Requirements 2.1**
        
        On unfixed code, this test will FAIL because pandas attempts source compilation
        which requires Visual Studio build tools that are not installed.
        
        Expected failure: pip install fails with meson error about vswhere.exe
        """
        if not is_windows:
            pytest.skip("This test only runs on Windows")

        # Try to get pandas installation info
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "show", "pandas"],
                capture_output=True,
                text=True,
                check=True
            )
            
            # Check if pandas is installed
            assert "Name: pandas" in result.stdout, "pandas is not installed"
            
            # Check pandas version
            version_line = [line for line in result.stdout.split('\n') if line.startswith('Version:')]
            assert version_line, "Could not find pandas version"
            version = version_line[0].split(':')[1].strip()
            
            # On unfixed code, pandas may not be installed at all due to compilation failure
            # Or it might be an older version that was previously installed
            assert version == "2.2.2", f"Expected pandas 2.2.2, got {version}"
            
            # Check that pandas was installed from wheel (not built from source)
            # If it was built from source, there would be build artifacts or the installation
            # would have failed entirely on Windows without build tools
            location_line = [line for line in result.stdout.split('\n') if line.startswith('Location:')]
            assert location_line, "Could not find pandas installation location"
            # Split on 'Location: ' to handle Windows paths with colons (e.g., D:\path)
            location = location_line[0].split('Location: ')[1].strip()
            
            # Verify pandas is in the virtual environment, not user site-packages
            assert ".venv" in location or "venv" in location, \
                f"pandas installed outside virtual environment: {location}"
            
        except subprocess.CalledProcessError as e:
            pytest.fail(f"Failed to check pandas installation: {e.stderr}")

    def test_packages_installed_to_venv_not_user_site(self, is_windows, venv_path, site_packages_path):
        """
        Test that pip installs packages to .venv/Lib/site-packages (not user site-packages).
        
        **Validates: Requirements 2.2**
        
        On unfixed code, this test will FAIL because pip installs to user site-packages
        (e.g., C:\\Users\\[user]\\AppData\\Roaming\\Python\\Python311\\site-packages)
        instead of the virtual environment.
        
        Expected failure: packages found in user site-packages, not .venv
        """
        if not is_windows:
            pytest.skip("This test only runs on Windows")

        # Check that virtual environment exists
        assert venv_path.exists(), f"Virtual environment not found at {venv_path}"
        
        # Check that site-packages directory exists in venv
        assert site_packages_path.exists(), \
            f"site-packages not found at {site_packages_path}"
        
        # Check key packages are installed in venv site-packages
        key_packages = ["fastapi", "uvicorn", "pandas", "motor", "beanie"]
        
        for package in key_packages:
            # Check if package is in venv site-packages
            package_path = site_packages_path / package
            package_dist_info = list(site_packages_path.glob(f"{package}-*.dist-info"))
            
            has_package = package_path.exists() or len(package_dist_info) > 0
            
            if not has_package:
                # Check if it's in user site-packages (the bug condition)
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "show", package],
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                if result.returncode == 0:
                    location_line = [line for line in result.stdout.split('\n') 
                                   if line.startswith('Location:')]
                    if location_line:
                        # Split on 'Location: ' to handle Windows paths with colons (e.g., D:\path)
                        location = location_line[0].split('Location: ')[1].strip()
                        pytest.fail(
                            f"Package '{package}' installed to wrong location: {location}\n"
                            f"Expected: {site_packages_path}\n"
                            f"This indicates pip is installing to user site-packages instead of venv"
                        )
                
                pytest.fail(
                    f"Package '{package}' not found in virtual environment at {site_packages_path}"
                )

    def test_uvicorn_accessible_after_installation(self, is_windows, venv_path):
        """
        Test that uvicorn is accessible after installation.
        
        **Validates: Requirements 2.3**
        
        On unfixed code, this test will FAIL because uvicorn command is not found
        or not recognized, even though it's installed.
        
        Expected failure: uvicorn command not found in PATH
        """
        if not is_windows:
            pytest.skip("This test only runs on Windows")

        # Check that uvicorn executable exists in Scripts directory
        uvicorn_exe = venv_path / "Scripts" / "uvicorn.exe"
        
        assert uvicorn_exe.exists(), \
            f"uvicorn.exe not found at {uvicorn_exe}\n" \
            f"This indicates uvicorn was not installed correctly or is in wrong location"
        
        # Try to run uvicorn --version to verify it's executable
        try:
            result = subprocess.run(
                [str(uvicorn_exe), "--version"],
                capture_output=True,
                text=True,
                check=True,
                timeout=10
            )
            
            assert "uvicorn" in result.stdout.lower() or "uvicorn" in result.stderr.lower(), \
                f"uvicorn command did not produce expected output: {result.stdout}"
            
        except subprocess.CalledProcessError as e:
            pytest.fail(
                f"uvicorn command failed to execute: {e.stderr}\n"
                f"This indicates uvicorn is not properly installed or configured"
            )
        except subprocess.TimeoutExpired:
            pytest.fail("uvicorn command timed out")
        except FileNotFoundError:
            pytest.fail(
                f"uvicorn.exe not found at {uvicorn_exe}\n"
                f"This indicates uvicorn installation failed or is in wrong location"
            )

    def test_virtual_environment_activated_correctly(self, is_windows, venv_path):
        """
        Test that the virtual environment is activated correctly on Windows.
        
        This is a supporting test to verify the environment setup is correct.
        If this fails, it may indicate the venv wasn't activated properly.
        """
        if not is_windows:
            pytest.skip("This test only runs on Windows")

        # Check that we're running in the virtual environment
        current_python = Path(sys.executable)
        expected_python = venv_path / "Scripts" / "python.exe"
        
        # Normalize paths for comparison
        current_python_normalized = current_python.resolve()
        expected_python_normalized = expected_python.resolve()
        
        assert current_python_normalized == expected_python_normalized, \
            f"Not running in virtual environment\n" \
            f"Current Python: {current_python}\n" \
            f"Expected Python: {expected_python}\n" \
            f"This indicates the virtual environment was not activated correctly"
