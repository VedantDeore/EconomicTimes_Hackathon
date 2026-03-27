# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Windows Dependency Installation Failures
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that pandas 2.2.2 installs from pre-built wheel without compilation on Windows
  - Test that pip installs packages to .venv/Lib/site-packages (not user site-packages) on Windows
  - Test that uvicorn is accessible after installation on Windows
  - The test assertions should match the Expected Behavior Properties from design (requirements 2.1, 2.2, 2.3)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - pandas compilation error messages
    - actual installation location of packages
    - uvicorn accessibility issues
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Windows Installation Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-Windows installations (Linux, macOS, Docker)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that Linux installations complete successfully with all packages installed
  - Test that macOS installations complete successfully with all packages installed
  - Test that Docker Compose builds complete successfully
  - Test that all application imports work correctly after installation
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 3. Fix for Windows dependency installation issues

  - [x] 3.1 Implement the fix
    - Verify pandas 2.2.2 has pre-built Windows wheels at https://pypi.org/project/pandas/2.2.2/#files
    - If no wheel exists for Python 3.11 Windows, pin to pandas version with confirmed wheels (e.g., pandas==2.2.0)
    - Create et-backend/SETUP.md with Windows-specific installation instructions:
      - Document virtual environment activation: `.venv\Scripts\activate` (CMD) or `.venv\Scripts\Activate.ps1` (PowerShell)
      - Document pip install command: `python -m pip install --no-user -r requirements.txt`
      - Document uvicorn execution: `python -m uvicorn app.main:app --reload`
    - Add environment variable documentation: Set `PIP_USER=0` before installation to prevent user site-packages
    - Optional: Create et-backend/setup.bat script for automated Windows setup
    - Verify Docker installation remains unaffected (uses Linux base image)
    - _Bug_Condition: isBugCondition(input) where input.operatingSystem == "Windows" AND input.command IN ["pip install -r requirements.txt"] AND (pandasCompilationFails OR packagesInstalledToUserSitePackages OR uvicornNotAccessible)_
    - _Expected_Behavior: allPackagesInstalled(result) AND pandasInstalledFromWheel(result) AND packagesInVirtualEnv(result) AND uvicornAccessible(result)_
    - _Preservation: Linux/macOS/Docker installations continue to work exactly as before_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [-] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Windows Dependency Installation Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify pandas installs from wheel without compilation
    - Verify packages install to .venv/Lib/site-packages
    - Verify uvicorn is accessible
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Windows Installation Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm Linux installations still work
    - Confirm macOS installations still work
    - Confirm Docker builds still work
    - Confirm all application imports still work
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
