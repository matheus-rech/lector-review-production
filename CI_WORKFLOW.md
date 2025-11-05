# CI Workflow for Tests and Linting

This document outlines the continuous integration (CI) workflow for the Lector Review application. This workflow automatically runs tests, lints code, and builds the application to ensure code quality and prevent regressions.

## Overview

The CI workflow is defined in the file `.github/workflows/ci.yml`. It is triggered on every push and pull request to the `master`, `main`, and `develop` branches.

## Workflow Jobs

The workflow consists of several jobs that run in parallel to provide fast feedback:

### 1. Lint Code (`lint`)

This job ensures code quality and consistency by running three checks:

**ESLint** checks for common JavaScript and React errors, enforcing code quality rules and best practices. The workflow fails if any linting errors are found.

**Prettier** verifies that all code follows consistent formatting rules. This ensures that code style remains uniform across the entire codebase.

**TypeScript** performs static type checking to catch type errors before runtime. This helps prevent bugs and improves code reliability.

### 2. Run Tests (`test`)

This job runs the automated test suite to verify application functionality:

**Unit Tests** are executed using Vitest, which runs all test files in the project. The tests run in CI mode to ensure consistent behavior.

**Coverage Report** is generated automatically, showing which parts of the code are covered by tests. The report is uploaded as an artifact and can be downloaded from the workflow run.

### 3. E2E Tests (`e2e-test`)

This job runs end-to-end tests using Playwright to verify the application works correctly in a real browser environment:

**Browser Installation** happens automatically, with Playwright installing Chromium, Firefox, and WebKit along with their dependencies.

**Test Execution** runs the full suite of end-to-end tests, simulating real user interactions with the application.

**Result Artifacts** are uploaded after the tests complete. The Playwright HTML report is always uploaded, while test videos are only uploaded on failure to help debug issues.

### 4. Build Application (`build`)

This job verifies that the application builds successfully for production:

**Vite Build** compiles the application into optimized production assets in the `dist/` directory.

**Build Verification** checks the output directory and displays the total size of the build.

**Artifact Upload** makes the build output available for download, which is useful for deployment or manual testing.

### 5. Status Check (`status-check`)

This final job provides a single, clear status indicator for the entire workflow:

**Job Dependencies** ensure this job only runs after all other jobs have completed, regardless of their success or failure.

**Status Verification** checks the result of each job and fails if any job failed. This provides a single status check that can be used as a required check for pull requests.

## How it Works

The workflow follows a structured execution pattern designed for efficiency and clarity. When code is pushed to a monitored branch or a pull request is created, GitHub Actions automatically triggers the workflow.

**Parallel Execution** is used for the `lint`, `test`, and `e2e-test` jobs, which run simultaneously to provide fast feedback. This reduces the total workflow time significantly compared to running jobs sequentially.

**Sequential Dependencies** are enforced for the `build` job, which only runs if both the `lint` and `test` jobs succeed. This prevents wasting resources on building code that has known issues.

**Artifact Collection** happens throughout the workflow, with test reports, coverage data, and build outputs being saved. These artifacts are retained for 7-30 days and can be downloaded from the GitHub Actions interface.

**Status Reporting** is handled by the final `status-check` job, which provides a single pass/fail indicator for the entire workflow. This makes it easy to see at a glance whether all checks passed.

## Triggers

The workflow is triggered by several events:

**Push Events** trigger the workflow whenever code is pushed to the `master`, `main`, or `develop` branches. This ensures that the main codebase is always tested.

**Pull Request Events** trigger the workflow when pull requests are opened or updated. This allows reviewers to see test results before merging code.

**Manual Triggers** are also supported via the `workflow_dispatch` event, allowing developers to run the workflow manually from the Actions tab.

## Artifacts

The workflow generates several artifacts that can be downloaded for inspection:

| Artifact | Description | Retention |
|----------|-------------|-----------|
| **coverage-report** | Code coverage report from Vitest | 30 days |
| **playwright-report** | E2E test results and HTML report | 30 days |
| **playwright-videos** | Test failure videos (only on failure) | 7 days |
| **build-output** | Production build from Vite | 7 days |

## Required Checks

For pull request protection, you can configure the following status checks as required:

-   **Lint Code** - Ensures code quality standards are met
-   **Run Tests** - Verifies unit tests pass
-   **E2E Tests** - Confirms end-to-end functionality
-   **Build Application** - Validates production build succeeds
-   **All Checks Passed** - Single status for all checks

## Viewing Results

After the workflow runs, you can view the results in several ways:

**GitHub Actions Tab** shows all workflow runs with their status. Click on a run to see detailed logs for each job.

**Pull Request Checks** display the workflow status directly on the pull request page, making it easy for reviewers to see if tests passed.

**Artifacts** can be downloaded from the workflow run summary page by scrolling to the bottom and clicking on the artifact name.

## Local Testing

Before pushing code, you can run the same checks locally:

```bash
# Run linting
npm run lint

# Check code formatting
npm run format:check

# Run type checking
npm run type-check

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Build the application
npm run build
```

## Troubleshooting

If the workflow fails, follow these steps to diagnose the issue:

**Check the Logs** by clicking on the failed job in the GitHub Actions interface. The logs will show exactly which command failed and why.

**Download Artifacts** if tests failed. The Playwright videos and reports can help identify what went wrong in E2E tests.

**Run Locally** to reproduce the issue on your machine. The workflow uses the same commands you can run locally.

**Fix and Push** once you've identified and fixed the issue. The workflow will automatically run again on the new push.

## Best Practices

To get the most value from the CI workflow, follow these best practices:

**Write Tests** for all new features and bug fixes. This ensures the CI workflow can catch regressions.

**Fix Linting Errors** before pushing. Run `npm run lint` locally to catch issues early.

**Keep Tests Fast** by focusing on unit tests for most coverage and using E2E tests for critical user flows.

**Review Artifacts** when tests fail. The coverage reports and test videos provide valuable debugging information.

**Use Branch Protection** to require the workflow to pass before merging pull requests. This prevents broken code from entering the main branch.

## Configuration

The workflow can be customized by editing `.github/workflows/ci.yml`:

-   **Add more branches** to the `on.push.branches` and `on.pull_request.branches` arrays
-   **Change Node.js version** in the `node-version` field
-   **Adjust retention days** for artifacts
-   **Add new jobs** for additional checks like security scanning or dependency audits

## Integration with Pull Requests

When configured as a required status check, this workflow ensures that:

-   All code is properly linted and formatted
-   All tests pass before merging
-   The application builds successfully
-   No regressions are introduced

This provides confidence that merged code maintains the quality standards of the project.

---

**Workflow File**: `.github/workflows/ci.yml`  
**Triggers**: Push and Pull Request to master/main/develop  
**Jobs**: 5 (lint, test, e2e-test, build, status-check)  
**Artifacts**: 4 types (coverage, playwright report, videos, build)
