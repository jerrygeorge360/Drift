# Contributing to Drift 🌊

First off, thank you for considering contributing to Drift! It's people like you who make the Defi ecosystem a better place for everyone.

This guide will help you get started with the development environment and the contribution workflow.

---

## 🚀 Getting Started

Please read the [README.md](README.md) first for the basic tech stack and architectural overview.

### Development Environment
Drift is a distributed system. To run it locally, you will need:
- **Node.js** (v18+)
- **PostgreSQL** (Database)
- **Redis** (Task Queue for BullMQ)
- **Hardhat** (Blockchain simulation)

---

## 🛠 Contribution Workflow

1.  **Fork the Repository**: Create your own fork of the `Drift` repository.
2.  **Create a Branch**: Use descriptive branch names:
    - `feat/your-feature-name` for new features.
    - `fix/issue-description` for bug fixes.
    - `docs/what-changed` for documentation updates.
3.  **Implement Your Changes**: Follow our coding standards (see below).
4.  **Write Tests**: Ensure your changes are covered by tests.
5.  **Submit a Pull Request**: Provide a clear description of your changes and link to any relevant issues.

---

## 📜 Coding Standards

### TypeScript
- **Strict Typing**: Avoid `any` at all costs. Use interfaces and types for everything.
- **Async/Await**: Use modern async patterns. Avoid callback hell.
- **Modular Design**: Keep modules focused and decoupled.

### Solidity
- **Security First**: Follow [ConsenSys Best Practices](https://github.com/ConsenSys/smart-contract-best-practices).
- **OpenZeppelin**: Use standard libraries for common tasks (Ownable, ReentrancyGuard, etc.).
- **Events**: Emit descriptive events for all state-changing operations.

### Database (Prisma)
- **Schema Management**: Always use `npx prisma migrate dev` for schema changes.
- **Naming**: Use camelCase for fields and PascalCase for models.

---

## 🧪 Testing & Verification

### Running Tests
We use **Jest** for unit and integration testing.
```bash
npm test
```


```

### Manual Verification
Before submitting a PR, verify your changes by running the full system:
```bash
npm run dev:all
```

---

## 💬 Communication

If you have questions or need help, feel free to:
- Open an **Issue** on GitHub.

Happy coding! 🌊
