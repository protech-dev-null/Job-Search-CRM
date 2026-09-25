#!/usr/bin/env bash
# Runs on the VDS; receives the SSH handler on stdin.
set -eu
umask 077
test "$(id -u)" = 0
test -s /opt/job-crm/compose.ghcr.yaml
command -v curl sha256sum systemd-run flock bash >/dev/null
exec 9>/run/lock/job-crm-deploy.lock
flock -n 9
temporary=$(mktemp /usr/local/sbin/job-crm-ssh.XXXXXX)
trap 'rm -f -- "$temporary"' EXIT
cat > "$temporary"
bash -n "$temporary"
install -d -m 0700 /var/lib/job-crm/bootstrap-backups
if test -f /usr/local/sbin/job-crm-ssh; then
  cp -p /usr/local/sbin/job-crm-ssh "/var/lib/job-crm/bootstrap-backups/ssh-$(date -u +%Y%m%dT%H%M%SZ)"
fi
chmod 0700 "$temporary"
chown root:root "$temporary"
mv -f "$temporary" /usr/local/sbin/job-crm-ssh
SSH_ORIGINAL_COMMAND=check /usr/local/sbin/job-crm-ssh
