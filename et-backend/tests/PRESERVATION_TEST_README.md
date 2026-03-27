# Preservation Property Tests - Execution Guide

## Overview

The preservation property tests in `test_preservation_properties.py` verify that non-Windows installations (Linux, macOS, Docker) work correctly BEFORE and AFTER implementing the Windows dependency fix. These tests follow the observation-first methodology.

## Test Execution Context

### On Windows (Current Platform)
- **Expected Behavior**: All tests SKIP
- **Reason**: These tests only run on non-Windows platforms
- **Status**: ✅ CORRECT - Tests are skipped as designed

### On Linux/macOS
- **Expected Behavior**: All tests PASS on unfixed code
- **Reason**: These platforms don't have the Windows dependency issues
- **Purpose**: Establish baseline behavior that must be preserved after fix

### On Docker
- **Expected Behavior**: Docker build test PASSES on unfixed code
- **Reason**: Docker uses Linux base image, unaffected by Windows issues
- **Purpose**: Verify Docker deployments remain functional after fix

## Test Coverage

### Property 2: Preservation - Non-Windows Installation Behavior

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

1. **test_linux_macos_installation_completes_successfully**
   - Verifies all key packages install successfully
   - Validates: Requirement 3.1

2. **test_linux_macos_packages_in_virtual_environment**
   - Verifies packages are in .venv/lib/pythonX.Y/site-packages
   - Validates: Requirement 3.1

3. **test_docker_compose_build_succeeds**
   - Verifies Docker Compose builds complete without errors
   - Validates: Requirement 3.2

4. **test_application_imports_work_correctly**
   - Verifies all application imports succeed
   - Validates: Requirement 3.3

5. **test_pytest_execution_works**
   - Verifies pytest can run with installed dependencies
   - Validates: Requirement 3.4

6. **test_pandas_version_correct**
   - Verifies pandas 2.2.2 is installed correctly
   - Validates: Requirements 3.1, 3.3

7. **test_uvicorn_executable_accessible**
   - Verifies uvicorn command works on Linux/macOS
   - Validates: Requirements 3.1, 3.3

8. **test_fastapi_application_can_import**
   - Verifies main application module imports successfully
   - Validates: Requirement 3.3

## Running Tests on Different Platforms

### Windows (Current)
```bash
# From et-backend directory
.venv\Scripts\python.exe -m pytest tests/test_preservation_properties.py -v

# Expected: 8 skipped
```

### Linux/macOS
```bash
# From et-backend directory
source .venv/bin/activate
python -m pytest tests/test_preservation_properties.py -v

# Expected on UNFIXED code: 8 passed (or some skipped if Docker not available)
# Expected on FIXED code: 8 passed (behavior preserved)
```

### Docker
```bash
# From project root
docker compose build backend

# Expected on UNFIXED code: Build succeeds
# Expected on FIXED code: Build succeeds (behavior preserved)
```

## Observation-First Methodology

1. **BEFORE Fix**: Run tests on unfixed code on Linux/macOS
   - Tests should PASS
   - This establishes the baseline behavior to preserve

2. **AFTER Fix**: Run tests on fixed code on Linux/macOS
   - Tests should still PASS
   - This confirms the fix didn't break existing functionality

3. **Windows Testing**: Use `test_windows_dependency_bug.py`
   - BEFORE fix: Tests FAIL (confirms bug exists)
   - AFTER fix: Tests PASS (confirms bug is fixed)

## CI/CD Integration

These tests should be run in CI/CD pipelines on:
- Ubuntu (latest LTS)
- macOS (latest)
- Docker builds

This ensures the Windows fix doesn't introduce regressions on other platforms.

## Notes

- Tests are designed to be non-destructive (read-only checks)
- Docker test requires Docker daemon to be running
- Some tests may skip if dependencies are not available
- All tests use subprocess to verify actual installation state
