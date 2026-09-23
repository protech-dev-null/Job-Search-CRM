#!/usr/bin/env bash
# Forced command for a dedicated key in /root/.ssh/authorized_keys.
set -Eeuo pipefail
umask 077
if [[ ${SSH_ORIGINAL_COMMAND:-} == check ]]; then
  test -s /opt/job-crm/compose.ghcr.yaml
  echo 'Deployment SSH protocol v2 is ready.'
elif [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy-v2\ (sha-([0-9a-f]{40})-[0-9]{1,16}-[0-9]{1,6})\ ([0-9a-f]{64})$ ]]; then
  tag=${BASH_REMATCH[1]}
  commit=${BASH_REMATCH[2]}
  expected_hash=${BASH_REMATCH[3]}
  install -d -m 0700 /var/lib/job-crm/scripts
  script_dir=$(mktemp -d "/var/lib/job-crm/scripts/${tag}-XXXXXX")
  # Download only from this repository at the release's exact commit.
  # The workflow independently supplies the checksum of its checked-out script.
  curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
    --connect-timeout 15 --max-time 60 --retry 2 \
    "https://raw.githubusercontent.com/protech-dev-null/Job-Search-CRM/${commit}/deploy/deploy-release.sh" \
    --output "$script_dir/deploy.sh"
  printf '%s  %s\n' "$expected_hash" "$script_dir/deploy.sh" | sha256sum --check --status
  bash -n "$script_dir/deploy.sh"
  chmod 0700 "$script_dir/deploy.sh"
  # A system service survives SSH disconnects and runner cancellation.
  # Each run keeps its own script; concurrent deliveries cannot overwrite it.
  exec /usr/bin/systemd-run --wait --collect \
    --unit="job-crm-deploy-${tag}-$(date +%s)" \
    "$script_dir/deploy.sh" "$tag"
else
  echo 'Only check and deploy-v2 <release tag> <script SHA256> are allowed. Update the workflow if it still sends deploy.' >&2
  exit 2
fi
