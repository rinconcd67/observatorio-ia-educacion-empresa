#!/usr/bin/env bash
# Read-only: native PR CI is evidence; it is never editorial or merge authorization.
set -euo pipefail
: "${REVIEW_BRANCH:?REVIEW_BRANCH is required}"
: "${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY is required}"
max_attempts="${PR_CI_MAX_ATTEMPTS:-120}"
poll_seconds="${PR_CI_POLL_SECONDS:-10}"
if ! [[ "$max_attempts" =~ ^[1-9][0-9]*$ && "$poll_seconds" =~ ^[0-9]+$ ]]; then
  echo '::error::Invalid PR CI polling configuration.'
  exit 1
fi
report() { printf '%s\n' "$*" | tee -a "$GITHUB_STEP_SUMMARY"; }
trap 'report "ERROR_OBSERVACION: no se pudo verificar CI mediante GitHub. No se declara éxito."' ERR
read_pr() { gh pr list --head "$REVIEW_BRANCH" --state open --json number,headRefOid,url --jq '.[0] // null'; }
pr_json="$(read_pr)"
if [ "$pr_json" = "null" ]; then
  report "SIN_PR: No hay propuesta abierta en ${REVIEW_BRANCH}."
  if [ "${REQUIRE_PR:-false}" = "true" ]; then exit 1; fi
  exit 0
fi
head_sha="$(printf '%s' "$pr_json" | jq -er '.headRefOid')"
pr_number="$(printf '%s' "$pr_json" | jq -er '.number')"
pr_url="$(printf '%s' "$pr_json" | jq -er '.url')"
state="SIN_EJECUCION"
for ((attempt=1; attempt<=max_attempts; attempt++)); do
  runs="$(gh run list --workflow ci.yml --branch "$REVIEW_BRANCH" --event pull_request --limit 30 --json databaseId,headSha,status,conclusion,url)"
  run="$(printf '%s' "$runs" | jq -c --arg sha "$head_sha" '[.[] | select(.headSha == $sha)] | first // null')"
  if [ "$run" != "null" ]; then
    run_id="$(printf '%s' "$run" | jq -er '.databaseId')"
    status="$(printf '%s' "$run" | jq -r '.status // empty')"
    conclusion="$(printf '%s' "$run" | jq -r '.conclusion // empty')"
    run_url="$(printf '%s' "$run" | jq -r '.url // empty')"
    if [ "$conclusion" = "action_required" ] || [ "$status" = "action_required" ]; then
      report "ACTION_REQUIRED: Intervención humana requerida para el PR ${pr_url}, SHA ${head_sha}: ${run_url}. Un dispatch o check sintético no resuelve esta aprobación."
      exit 1
    fi
    if [ "$status" = "completed" ]; then
      if [ "$conclusion" != "success" ]; then
        report "CI_TERMINADO_${conclusion}: ${run_url}. El CI nativo no aprobó ${head_sha}."
        exit 1
      fi
      # Verify the actual validate job, not a synthetic check with the same name.
      detail="$(gh run view "$run_id" --json event,headSha,jobs,status,conclusion)"
      if ! printf '%s' "$detail" | jq -e --arg sha "$head_sha" '.event == "pull_request" and .headSha == $sha and .status == "completed" and .conclusion == "success" and ([.jobs[] | select(.name == "validate" and .status == "completed" and .conclusion == "success")] | length > 0)' >/dev/null; then
        report "SIN_VALIDATE_NATIVO: ${run_url} no prueba un job validate exitoso para ${head_sha}."
        exit 1
      fi
      current="$(read_pr)"
      if ! printf '%s' "$current" | jq -e --arg sha "$head_sha" --argjson number "$pr_number" '.number == $number and .headRefOid == $sha' >/dev/null; then
        report "PR_CAMBIO: el PR se cerró o cambió de SHA durante la espera; repetir verificación."
        exit 1
      fi
      report "CI_NATIVO_APROBADO: ${run_url}, SHA ${head_sha}. Propuesta: ${pr_url}. Esto no confirma que sea fusionable ni autoriza su publicación; requiere revisión humana."
      exit 0
    fi
    state="PENDIENTE_${status}"
  fi
  if [ "$attempt" -lt "$max_attempts" ]; then sleep "$poll_seconds"; fi
done
report "${state}: se agotó la espera de observación para ${head_sha} (${pr_url}); no equivale a pruebas fallidas. Revise CI y vuelva a verificar. No se creó ni modificó ningún check."
exit 1
