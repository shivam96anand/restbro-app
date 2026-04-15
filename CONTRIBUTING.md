# Contributing to Restbro

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a branch from `main` using the naming convention below
4. Install dependencies: `npm install`
5. Make your changes
6. Ensure lint passes: `npm run lint`
7. Ensure build succeeds: `npm run build`
8. Run tests: `npm test`
9. Commit your changes with a clear message
10. Push to your fork and open a Pull Request against `main`

## Branch Naming Convention

Use the following prefixes for your branches:

| Prefix | Use case | Example |
|---|---|---|
| `feature/` | New features | `feature/auth-oauth2` |
| `fix/` | Bug fixes | `fix/header-parsing-crash` |
| `docs/` | Documentation changes | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/cleanup-request-builder` |
| `ci/` | CI/CD changes | `ci/add-windows-tests` |

## Pull Request Guidelines

- Fill out the PR template completely (What, Why, Impact)
- Keep PRs focused — one feature or fix per PR
- All CI checks must pass before review
- PRs require at least 2 approvals before merging
- All PRs are squash-merged to keep `main` history clean

## Code Style

- TypeScript for all source code
- Follow existing patterns in the codebase
- Run `npm run lint` before committing

## Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include steps to reproduce for bugs
- Include expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the project's existing license.
