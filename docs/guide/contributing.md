# Contributing

Thank you for your interest in contributing to FamilyTree!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/FamilyTree.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

1. Make your changes
2. Test on both iOS and Android simulators
3. Run E2E tests: `npm run test:e2e`
4. Commit your changes with a descriptive message
5. Push and open a Pull Request

## Code Style

- TypeScript is used throughout — avoid `any` types
- Follow existing patterns for components and screens
- Use the centralized theme (`src/theme/`) for colors, fonts, and spacing
- UI text must be in Polish (the app language)

## Adding a New Screen

1. Create the screen in `src/screens/`
2. Add it to the appropriate navigation stack in `src/navigation/`
3. Add a Maestro E2E test in `.maestro/`

## Reporting Issues

Please open an issue on GitHub with:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Device/simulator info

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
