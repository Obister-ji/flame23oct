#!/bin/bash

# FlameAI Security Scan Script
# This script runs comprehensive security scans using Semgrep

set -e

echo "🔒 FlameAI Security Scan"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if semgrep is installed
if ! command -v semgrep &> /dev/null; then
    print_error "Semgrep is not installed. Please install it first:"
    echo "  brew install semgrep"
    echo "  or"
    echo "  python3 -m pip install semgrep"
    exit 1
fi

print_status "Starting comprehensive security scan..."

# Create reports directory if it doesn't exist
mkdir -p reports

# Get current date for report naming
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_DIR="reports/security-scan-$DATE"
mkdir -p "$REPORT_DIR"

print_status "Reports will be saved to: $REPORT_DIR"

# Run basic security scan
print_status "Running basic security scan..."
semgrep --config=auto \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    --exclude=.git \
    --json \
    --output="$REPORT_DIR/basic-scan.json" \
    . 2>&1 | tee "$REPORT_DIR/basic-scan.log"

# Run Node.js specific scan
print_status "Running Node.js security scan..."
semgrep --config=p/nodejs \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    --exclude=.git \
    --json \
    --output="$REPORT_DIR/nodejs-scan.json" \
    . 2>&1 | tee "$REPORT_DIR/nodejs-scan.log"

# Run XSS scan
print_status "Running XSS vulnerability scan..."
semgrep --config=p/xss \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    --exclude=.git \
    --json \
    --output="$REPORT_DIR/xss-scan.json" \
    . 2>&1 | tee "$REPORT_DIR/xss-scan.log"

# Run SQL injection scan
print_status "Running SQL injection scan..."
semgrep --config=p/sql-injection \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    --exclude=.git \
    --json \
    --output="$REPORT_DIR/sql-injection-scan.json" \
    . 2>&1 | tee "$REPORT_DIR/sql-injection-scan.log"

# Run React security scan
print_status "Running React security scan..."
semgrep --config=p/react \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    --exclude=.git \
    --json \
    --output="$REPORT_DIR/react-scan.json" \
    . 2>&1 | tee "$REPORT_DIR/react-scan.log"

# Generate summary report
print_status "Generating summary report..."
cat > "$REPORT_DIR/summary.md" << EOF
# Security Scan Summary

**Date**: $(date)
**Scan Type**: Comprehensive Security Scan
**Reports Directory**: $REPORT_DIR

## Scan Results

### Basic Security Scan
- Findings: $(jq -r '.results | length' "$REPORT_DIR/basic-scan.json" 2>/dev/null || echo "0")
- Rules Run: $(grep -o "Ran [0-9]* rules" "$REPORT_DIR/basic-scan.log" | grep -o "[0-9]*" || echo "N/A")

### Node.js Security Scan
- Findings: $(jq -r '.results | length' "$REPORT_DIR/nodejs-scan.json" 2>/dev/null || echo "0")
- Rules Run: $(grep -o "Ran [0-9]* rules" "$REPORT_DIR/nodejs-scan.log" | grep -o "[0-9]*" || echo "N/A")

### XSS Vulnerability Scan
- Findings: $(jq -r '.results | length' "$REPORT_DIR/xss-scan.json" 2>/dev/null || echo "0")
- Rules Run: $(grep -o "Ran [0-9]* rules" "$REPORT_DIR/xss-scan.log" | grep -o "[0-9]*" || echo "N/A")

### SQL Injection Scan
- Findings: $(jq -r '.results | length' "$REPORT_DIR/sql-injection-scan.json" 2>/dev/null || echo "0")
- Rules Run: $(grep -o "Ran [0-9]* rules" "$REPORT_DIR/sql-injection-scan.log" | grep -o "[0-9]*" || echo "N/A")

### React Security Scan
- Findings: $(jq -r '.results | length' "$REPORT_DIR/react-scan.json" 2>/dev/null || echo "0")
- Rules Run: $(grep -o "Ran [0-9]* rules" "$REPORT_DIR/react-scan.log" | grep -o "[0-9]*" || echo "N/A")

## Total Findings
$(TOTAL_FINDINGS=$(jq -s '[.[] | .results | length] | add' "$REPORT_DIR"/*.json 2>/dev/null || echo "0"); echo "$TOTAL_FINDINGS") total findings across all scans

## Next Steps
1. Review the detailed JSON reports for each scan
2. Address any high-severity findings immediately
3. Create tickets for medium and low-severity findings
4. Update code to fix identified vulnerabilities
5. Re-run scans to verify fixes

## Files Generated
- basic-scan.json: Basic security scan results
- nodejs-scan.json: Node.js specific security issues
- xss-scan.json: Cross-site scripting vulnerabilities
- sql-injection-scan.json: SQL injection vulnerabilities
- react-scan.json: React security issues
- *.log: Detailed scan logs for each scan type
EOF

# Calculate total findings
TOTAL_FINDINGS=$(jq -s '[.[] | .results | length] | add' "$REPORT_DIR"/*.json 2>/dev/null || echo "0")

# Display summary
echo ""
print_success "Security scan completed!"
echo ""
echo "📊 Summary:"
echo "   Total Findings: $TOTAL_FINDINGS"
echo "   Reports Location: $REPORT_DIR"
echo ""

if [ "$TOTAL_FINDINGS" -eq 0 ]; then
    print_success "No security vulnerabilities found! 🎉"
elif [ "$TOTAL_FINDINGS" -le 5 ]; then
    print_warning "Found $TOTAL_FINDINGS minor security issues. Review recommended."
else
    print_error "Found $TOTAL_FINDINGS security issues. Immediate attention required!"
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Review the detailed reports in $REPORT_DIR"
echo "   2. Check the summary.md file for an overview"
echo "   3. Address any critical findings first"
echo "   4. Run this script again after fixing issues"

# Create a symlink to the latest report
ln -sf "$REPORT_DIR" reports/latest
print_status "Created symlink: reports/latest -> $REPORT_DIR"

echo ""
print_success "Done! Check $REPORT_DIR/summary.md for detailed results."