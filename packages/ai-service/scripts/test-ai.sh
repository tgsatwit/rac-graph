#!/bin/bash

# Script to run all AI-related tests with the RUN_AI_TESTS flag enabled

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running AI Service Tests${NC}"
echo -e "${YELLOW}========================${NC}"

# Check if a specific test was specified
if [ "$1" != "" ]; then
  echo -e "${GREEN}Running specific test: $1${NC}"
  RUN_AI_TESTS=true pnpm test "$1"
else
  echo -e "${GREEN}Running all AI tests${NC}"
  # Run each test file separately to clearly see which ones pass/fail
  RUN_AI_TESTS=true pnpm test llm.test.ts
  LLM_STATUS=$?
  
  RUN_AI_TESTS=true pnpm test workflow.test.ts
  WORKFLOW_STATUS=$?
  
  RUN_AI_TESTS=true pnpm test process-extraction.test.ts
  PROCESS_STATUS=$?
  
  # Report overall success/failure
  echo -e "\n${YELLOW}Test Summary${NC}"
  echo -e "========================"
  
  if [ $LLM_STATUS -eq 0 ]; then
    echo -e "LLM Tests: ${GREEN}PASSED${NC}"
  else
    echo -e "LLM Tests: ${RED}FAILED${NC}"
  fi
  
  if [ $WORKFLOW_STATUS -eq 0 ]; then
    echo -e "Workflow Tests: ${GREEN}PASSED${NC}"
  else
    echo -e "Workflow Tests: ${RED}FAILED${NC}"
  fi
  
  if [ $PROCESS_STATUS -eq 0 ]; then
    echo -e "Process Extraction Tests: ${GREEN}PASSED${NC}"
  else
    echo -e "Process Extraction Tests: ${RED}FAILED${NC}"
  fi
  
  # Set exit code based on all tests
  if [ $LLM_STATUS -eq 0 ] && [ $WORKFLOW_STATUS -eq 0 ] && [ $PROCESS_STATUS -eq 0 ]; then
    echo -e "\n${GREEN}All AI tests passed successfully!${NC}"
    exit 0
  else
    echo -e "\n${RED}Some AI tests failed!${NC}"
    exit 1
  fi
fi 