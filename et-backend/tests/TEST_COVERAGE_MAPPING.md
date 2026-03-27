# Test Coverage Mapping

## Preservation Property Tests (test_preservation_properties.py)

### Property 2: Preservation - Non-Windows Installation Behavior

| Test Function | Requirements Validated | Description |
|--------------|----------------------|-------------|
| `test_linux_macos_installation_completes_successfully` | 3.1 | Verifies all key packages (fastapi, uvicorn, pandas, motor, beanie, etc.) install successfully on Linux/macOS |
| `test_linux_macos_packages_in_virtual_environment` | 3.1 | Verifies packages are installed in .venv/lib/pythonX.Y/site-packages (not system or user locations) |
| `test_docker_compose_build_succeeds` | 3.2 | Verifies Docker Compose builds complete successfully without dependency issues |
| `test_application_imports_work_correctly` | 3.3 | Verifies all application imports (FastAPI, Motor, Beanie, pandas, jose, passlib) work correctly |
| `test_pytest_execution_works` | 3.4 | Verifies pytest can execute tests with installed dependencies |
| `test_pandas_version_correct` | 3.1, 3.3 | Verifies pandas 2.2.2 is installed correctly and version remains consistent |
| `test_uvicorn_executable_accessible` | 3.1, 3.3 | Verifies uvicorn command is accessible and executable on Linux/macOS |
| `test_fastapi_application_can_import` | 3.3 | Verifies the main FastAPI application module (app.main) can be imported |

## Bug Condition Tests (test_windows_dependency_bug.py)

### Property 1: Bug Condition - Windows Dependency Installation Failures

| Test Function | Requirements Validated | Description |
|--------------|----------------------|-------------|
| `test_pandas_installs_from_wheel_not_source` | 2.1 | Verifies pandas 2.2.2 installs from pre-built wheel without compilation on Windows |
| `test_packages_installed_to_venv_not_user_site` | 2.2 | Verifies pip installs packages to .venv/Lib/site-packages (not user site-packages) on Windows |
| `test_uvicorn_accessible_after_installation` | 2.3 | Verifies uvicorn.exe is accessible from .venv/Scripts on Windows |
| `test_virtual_environment_activated_correctly` | Supporting | Verifies the virtual environment is activated correctly on Windows |

## Requirements Coverage Summary

### Expected Behavior (Windows Fix)
- ✅ **2.1**: Covered by `test_pandas_installs_from_wheel_not_source`
- ✅ **2.2**: Covered by `test_packages_installed_to_venv_not_user_site`
- ✅ **2.3**: Covered by `test_uvicorn_accessible_after_installation`

### Unchanged Behavior (Preservation)
- ✅ **3.1**: Covered by 4 tests (installation success, packages in venv, pandas version, uvicorn accessible)
- ✅ **3.2**: Covered by `test_docker_compose_build_succeeds`
- ✅ **3.3**: Covered by 4 tests (application imports, pandas version, uvicorn accessible, FastAPI app import)
- ✅ **3.4**: Covered by `test_pytest_execution_works`

## Test Execution Strategy

### Phase 1: Observation (BEFORE Fix)
1. Run `test_windows_dependency_bug.py` on Windows
   - **Expected**: Tests FAIL (confirms bug exists)
   
2. Run `test_preservation_properties.py` on Linux/macOS
   - **Expected**: Tests PASS (establishes baseline)

### Phase 2: Validation (AFTER Fix)
1. Run `test_windows_dependency_bug.py` on Windows
   - **Expected**: Tests PASS (confirms bug is fixed)
   
2. Run `test_preservation_properties.py` on Linux/macOS
   - **Expected**: Tests PASS (confirms preservation)

## Platform-Specific Behavior

| Test Suite | Windows | Linux/macOS | Docker |
|------------|---------|-------------|--------|
| `test_windows_dependency_bug.py` | Runs | Skips | Skips |
| `test_preservation_properties.py` | Skips | Runs | Runs (Docker test only) |

This ensures:
- Windows-specific tests only run on Windows
- Preservation tests only run on platforms they're designed to protect
- No false positives or negatives from platform mismatches
