#!/usr/bin/env bash
# Read-only observation. A successful dispatched job does not imply an accepted PR check suite.
set -euo pipefail
: "${REVIEW_BRANCH:?REVIEW_BRANCH is required}"
: "${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY is required}"
pr_json="$(gh pr list --head "$REVIEW_BRANCH" --state open --json number,headRefOid,url --jq '.[0] // null')"
if [ "$pr_json" = "null" ]; then
  echo "No hay propuesta abierta en ${REVIEW_BRANCH}." >> "$GITHUB_STEP_SUMMARY"
  exit 0
fi
head_sha="$(printf '%s' "$pr_json" | jq -r '.headRefOid')"
pr_url="$(printf '%s' "$pr_json" | jq -r '.url')"
runs="$(gh run list --workflow ci.yml --branch "$REVIEW_BRANCH" --event pull_request --limit 30 --json headSha,conclusion,url)"
blocked_url="$(printf '%s' "$runs" | jq -r --arg sha "$head_sha" '[.[] | select(.headSha == $sha)] | first | select(.conclusion == "action_required") | .url // empty')"
if [ -n "$blocked_url" ]; then
  {
    echo '### Intervención humana requerida'
    echo "La validación por workflow_dispatch puede estar aprobada, pero GitHub mantiene action_required para el evento pull_request del mismo SHA ${head_sha}."
    echo "Revise el motivo y la aprobación pendiente en ${blocked_url}; vuelva a ejecutar la validación del PR si corresponde."
    echo "Propuesta: ${pr_url}. No se modificaron protecciones ni se concedió aprobación automática."
  } >> "$GITHUB_STEP_SUMMARY"
  exit 1
fi
echo "Propuesta disponible para revisión humana: ${pr_url}. Este control no confirma que sea fusionable ni autoriza su publicación." >> "$GITHUB_STEP_SUMMARY"
