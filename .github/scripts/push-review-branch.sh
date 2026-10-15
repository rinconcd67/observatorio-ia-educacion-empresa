#!/usr/bin/env bash
set -euo pipefail
branch="${1:?review branch required}"
# Empty expected OID means the remote branch must not exist. No tracking ref is needed.
expected_oid="${2?expected remote OID required (may be empty)}"
git push "--force-with-lease=refs/heads/${branch}:${expected_oid}" origin "HEAD:refs/heads/${branch}"
