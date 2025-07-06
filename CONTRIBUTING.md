# Contributing to create-bun-stack

Thank you for your interest in contributing to create-bun-stack! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/create-bun-stack.git`
3. Install dependencies: `bun install`
4. Create a feature branch: `git checkout -b my-feature`

## Development Setup

```bash
# Install dependencies
bun install

# Run tests
bun test

# Test the CLI locally
bun cli.ts --name test-project --db sqlite --skip-install
```

## Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test files
bun test tests/unit/cli.test.ts
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Run `bun run check` before submitting (if available)
- Keep commits focused and atomic

## Submitting Changes

1. Ensure all tests pass
2. Add tests for new functionality
3. Update documentation as needed
4. Create a pull request with a clear description of changes

## Pull Request Guidelines

- **Title**: Use a clear and descriptive title
- **Description**: Explain what changes you made and why
- **Testing**: Describe how you tested your changes
- **Breaking Changes**: Clearly note any breaking changes

## Testing Your Changes

Before submitting a PR, test the CLI end-to-end:

```bash
# Test creating a new project
bun cli.ts --name my-test-app

# Navigate to the created project
cd my-test-app

# Install dependencies
bun install

# Run the development server
bun run dev

# Run tests
bun test
```

## Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce the issue
- Include your environment details (OS, Bun version, etc.)
- Provide error messages and stack traces when applicable

## Feature Requests

- Open an issue to discuss new features before implementing
- Explain the use case and benefits
- Consider backwards compatibility

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them get started
- Focus on what is best for the community

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for contributing to create-bun-stack! 🚀
