#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
input="$(cat)"

should_gate=false

if command -v jq >/dev/null 2>&1; then
  hook_event="$(echo "$input" | jq -r '.hook_event_name // empty')"
  command="$(echo "$input" | jq -r '.command // empty')"
  tool_name="$(echo "$input" | jq -r '.tool_name // .toolName // empty')"
  mcp_tool="$(echo "$input" | jq -r '.mcp_tool // .mcpTool // empty')"

  if [[ "$hook_event" == "beforeShellExecution" ]] && [[ "$command" =~ gh[[:space:]]+pr[[:space:]]+create ]]; then
    should_gate=true
  fi

  if [[ "$hook_event" == "beforeMCPExecution" ]]; then
    combined="${tool_name}${mcp_tool}"
    if [[ "$combined" == *create_pull_request* ]]; then
      should_gate=true
    fi
  fi
else
  if [[ "$input" == *"pr create"* ]] || [[ "$input" == *create_pull_request* ]]; then
    should_gate=true
  fi
fi

if [[ "$should_gate" != true ]]; then
  exit 0
fi

echo "PR gate: running preflight before pull request creation..." >&2

if ! "$ROOT/.agents/hooks/preflight.sh" >&2; then
  echo "PR gate: preflight failed. Fix lint/format issues, then retry gh pr create." >&2
  exit 2
fi

exit 0
