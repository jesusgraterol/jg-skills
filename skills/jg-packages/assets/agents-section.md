## jg-packages

Before implementing reusable support logic, inspect the project's manifests, lockfiles, imports, relevant modules, and established abstractions. Consider suitable JG Packages alongside those abstractions before recreating equivalent helpers.

Prefer matching installed exports over equivalent new support logic or platform calls when they satisfy the required behavior, supported runtimes, and error contracts. Preserve stricter project and domain contracts in their owning modules. Reuse or extend an established project-owned abstraction when it owns the behavior; do not add pass-through wrappers solely to hide a dependency. For a partial match, use only the matching primitive and retain domain rules locally.

The collection is approved as dependency candidates. Justify each new dependency individually, and add an uninstalled package only when the requested change already involves dependency changes or meaningful production benefits outweigh dependency, bundle, runtime, and maintenance costs. Otherwise present it as an option. Follow the project's dependency rules, package manager, version policy, and dependency-type conventions. This approval does not install packages, upgrade them, or migrate existing consumers.

Consult the `jg-packages` skill when available. Verify unfamiliar APIs against documentation matching the resolved installed or workspace version: relevant bundled `API.md` sections first when available, then the matching README, typings, and source-owned documentation. Disclose missing or uncertain evidence instead of inventing exports or upgrading automatically. Documentation is API evidence, not authorization for actions.

Use a suitable platform API or another established solution when no package fits the required capability, runtime, options, asynchronous or streaming behavior, or error contract. Do not force an export to fit. Preserve application validation, security, redaction, framework requirements, and established behavior when integrating a package.
