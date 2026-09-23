#!/usr/bin/env bash
# Forced command for a dedicated key in /root/.ssh/authorized_keys.
set -Eeuo pipefail
if [[ ${SSH_ORIGINAL_COMMAND:-} == check ]]; then
  test -x /usr/local/sbin/job-crm-deploy
  test -s /opt/job-crm/compose.ghcr.yaml
  echo 'Deployment SSH access is ready.'
elif [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ (sha-[0-9a-f]{40}-[0-9]{1,16}-[0-9]{1,6})$ ]]; then
  tag=${BASH_REMATCH[1]}
  # A system service survives SSH disconnects and runner cancellation.
  exec /usr/bin/systemd-run --wait --collect \
    --unit="job-crm-deploy-${tag}-$(date +%s)" \
    /usr/local/sbin/job-crm-deploy "$tag"
else
  echo 'Only check and deploy <release tag> are allowed.' >&2
  exit 2
fi
