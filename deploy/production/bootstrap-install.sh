#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${root@$VDS_IP:?Set root@$VDS_IP from production secrets}"
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir/.."
test -n "$ADMIN_KEY" || { echo '::error::Add temporary production secret VDS_BOOTSTRAP_SSH_KEY'; exit 1; }
test -n "$KNOWN_HOSTS"
test -n "$VDS_IP"
ssh_dir=$(mktemp -d)
trap 'rm -rf -- "$ssh_dir"' EXIT
printf '%s\n' "$ADMIN_KEY" | tr -d '\r' > "$ssh_dir/key"
printf '%s\n' "$KNOWN_HOSTS" | tr -d '\r' > "$ssh_dir/known_hosts"
ssh-keygen -y -P '' -f "$ssh_dir/key" > /dev/null
bash -n deploy/ssh-deploy-command.sh
remote_command=$(cat "$script_dir/bootstrap-install-remote.sh")
ssh -i "$ssh_dir/key" -o IdentitiesOnly=yes -o BatchMode=yes \
  -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$ssh_dir/known_hosts" \
  -o ConnectTimeout=15 -o ServerAliveInterval=30 \
  "root@$VDS_IP" "$remote_command" < deploy/ssh-deploy-command.sh
