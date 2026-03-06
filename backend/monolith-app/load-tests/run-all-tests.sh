#!/bin/bash

# Run All Load Tests
# Executes complete load testing suite

set -e

echo "╔════════════════════════════════════════╗"
echo "║   Load Testing Suite - Starting       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-http://localhost:3000}
RESULTS_DIR="./results/$(date +%Y%m%d-%H%M%S)"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}Configuration:${NC}"
echo "  Base URL: $BASE_URL"
echo "  Results: $RESULTS_DIR"
echo ""

# Function to run test
run_test() {
  local test_name=$1
  local test_file=$2
  local duration=$3
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}Running: $test_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "Duration: $duration"
  echo "Started: $(date)"
  echo ""
  
  # Run k6 test
  if k6 run \
    --out json="$RESULTS_DIR/$test_name-results.json" \
    --summary-export="$RESULTS_DIR/$test_name-summary.json" \
    "$test_file"; then
    echo -e "${GREEN}✅ $test_name completed successfully${NC}"
  else
    echo -e "${RED}❌ $test_name failed${NC}"
    return 1
  fi
  
  echo ""
  sleep 5  # Cool down between tests
}

# Test 1: Smoke Test
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Test 1/4: Smoke Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
run_test "smoke-test" "smoke-test.js" "1 minute"

# Test 2: Load Test
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Test 2/4: Load Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
run_test "load-test" "load-test.js" "10 minutes"

# Test 3: Spike Test
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Test 3/4: Spike Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
run_test "spike-test" "spike-test.js" "5 minutes"

# Test 4: Stress Test
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Test 4/4: Stress Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
run_test "stress-test" "stress-test.js" "20 minutes"

# Generate summary report
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}All Tests Completed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""

# Create summary report
cat > "$RESULTS_DIR/SUMMARY.md" << EOF
# Load Testing Summary

**Date**: $(date)
**Base URL**: $BASE_URL

## Tests Executed

1. ✅ Smoke Test (1 minute)
2. ✅ Load Test (10 minutes)
3. ✅ Spike Test (5 minutes)
4. ✅ Stress Test (20 minutes)

## Results

Results are available in JSON format:
- \`smoke-test-results.json\`
- \`load-test-results.json\`
- \`spike-test-results.json\`
- \`stress-test-results.json\`

## Next Steps

1. Review detailed results in JSON files
2. Analyze performance metrics in Grafana
3. Identify bottlenecks and optimization opportunities
4. Implement improvements
5. Re-run tests to validate improvements

## Key Metrics to Review

- Response times (p50, p95, p99)
- Error rates
- Throughput (requests/second)
- Resource utilization (CPU, memory, database)
- Breaking point (from stress test)
- Spike handling (from spike test)

EOF

echo -e "${GREEN}Summary report created: $RESULTS_DIR/SUMMARY.md${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review results: cat $RESULTS_DIR/SUMMARY.md"
echo "  2. Analyze metrics: Open Grafana dashboards"
echo "  3. Check logs: tail -f logs/app.log"
echo ""
echo -e "${GREEN}🎉 Load testing suite completed successfully!${NC}"
