#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${VDS_IP:?Set VDS_IP from production secrets}"
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir/../.."
test -n "$DEPLOY_KEY"
ssh_dir=$(mktemp -d)
trap 'rm -rf -- "$ssh_dir"' EXIT
printf '%s\n' "$DEPLOY_KEY" | tr -d '\r' > "$ssh_dir/deploy"
printf '%s\n' "$ADMIN_KEY" | tr -d '\r' > "$ssh_dir/admin"
printf '%s\n' "$KNOWN_HOSTS" | tr -d '\r' > "$ssh_dir/known_hosts"
options=(-o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$ssh_dir/known_hosts" -o ConnectTimeout=15)
result=$(ssh -i "$ssh_dir/deploy" "${options[@]}" "root@$VDS_IP" check)
test "$result" = 'Deployment SSH protocol v2 is ready.'
if [[ $RESTORE_EXISTING == true ]]; then
  ssh -i "$ssh_dir/admin" "${options[@]}" "root@$VDS_IP" \
    'flock -n /run/lock/job-crm-deploy.lock docker start crm-production-api-1 crm-production-web-1'
fi
echo 'Protocol v2 installed and regular deployment key checked. Remove VDS_BOOTSTRAP_SSH_KEY from production secrets.' >> "$GITHUB_STEP_SUMMARY"
