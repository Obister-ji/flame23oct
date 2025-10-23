# Security Scanning Guide

This document explains how to use Semgrep for security scanning in the FlameAI project.

## Overview

We use Semgrep, a static analysis tool, to scan our codebase for security vulnerabilities. The scanning is integrated into our development workflow through:

1. **Manual scans** using npm scripts
2. **Pre-commit hooks** for local development
3. **GitHub Actions** for CI/CD automation

## Quick Start

### Install Dependencies

```bash
# Install Semgrep (if not already installed)
brew install semgrep

# Install pre-commit hooks (optional but recommended)
pip install pre-commit
pre-commit install
```

### Run Security Scans

```bash
# Run comprehensive security scan
npm run security:scan

# Run quick security scan
npm run security:quick

# Run specific vulnerability scans
npm run security:nodejs    # Node.js security issues
npm run security:xss       # Cross-site scripting
npm run security:sql       # SQL injection
npm run security:react     # React security issues
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run security:scan` | Comprehensive security scan with detailed reports |
| `npm run security:quick` | Quick security scan using auto rules |
| `npm run security:nodejs` | Node.js specific security issues |
| `npm run security:xss` | Cross-site scripting vulnerabilities |
| `npm run security:sql` | SQL injection vulnerabilities |
| `npm run security:react` | React security issues |

## Understanding Scan Results

### Severity Levels

- **ERROR**: Critical security issues that must be fixed immediately
- **WARNING**: Security issues that should be fixed soon
- **INFO**: Low-severity issues or security best practices

### Common Findings

#### Log Injection (INFO)
These occur when user input is logged without proper sanitization. While low severity, they should be fixed to prevent log forgery.

**Example Fix:**
```javascript
// Instead of:
console.log(`User input: ${userInput}`);

// Use:
console.log('User input:', sanitizeForLogs(userInput));
```

## Configuration

### Semgrep Configuration

The main configuration is in `.semgrep.yml`. You can modify this to:
- Add custom rules
- Exclude specific files or directories
- Adjust severity levels

### Pre-commit Hooks

Pre-commit hooks are configured in `.pre-commit-config.yaml`. They run security scans automatically before each commit.

### CI/CD Integration

GitHub Actions workflow is in `.github/workflows/semgrep-security-scan.yml`. It:
- Runs on every push and pull request
- Generates security reports
- Updates security badges
- Comments on PRs with scan results

## Reports

### Local Reports

When running `npm run security:scan`, detailed reports are saved to:
```
reports/security-scan-YYYY-MM-DD_HH-MM-SS/
├── basic-scan.json
├── nodejs-scan.json
├── xss-scan.json
├── sql-injection-scan.json
├── react-scan.json
├── summary.md
└── *.log files
```

### CI/CD Reports

GitHub Actions generates:
- SARIF files uploaded to GitHub Security tab
- Artifacts with detailed scan results
- PR comments with scan summaries

## Best Practices

### Before Committing

1. Run `npm run security:quick` to check for critical issues
2. Fix any ERROR severity findings
3. Commit your changes (pre-commit hooks will run automatically)

### Before Releases

1. Run `npm run security:scan` for comprehensive analysis
2. Review all findings, including INFO level
3. Document any accepted risks
4. Update security documentation

### Regular Maintenance

1. Review security scan results weekly
2. Update Semgrep rules regularly
3. Add custom rules for project-specific security requirements
4. Monitor false positives and adjust configuration

## Troubleshooting

### Common Issues

#### Semgrep not found
```bash
# Install Semgrep
brew install semgrep
# or
python3 -m pip install semgrep
```

#### Scan takes too long
- Exclude large directories in `.semgrep.yml`
- Use `npm run security:quick` for faster scans
- Consider running scans on specific file types

#### False positives
- Add exceptions in `.semgrep.yml`
- Use `# nosemgrep` comments for specific lines
- Report false positives to Semgrep

### Getting Help

1. Check Semgrep documentation: https://semgrep.dev/docs
2. Review scan logs in the reports directory
3. Check GitHub Actions logs for CI/CD issues
4. Create an issue in the project repository

## Security Policy

For reporting security vulnerabilities, please follow our [Security Policy](SECURITY_POLICY.md).

## Resources

- [Semgrep Documentation](https://semgrep.dev/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Security Best Practices](https://semgrep.dev/docs/writing-rules/rule-ideas/)