#!/usr/bin/env bash
# Run from any directory. Backup is consistent without stopping the API.
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
cd "$(dirname "${BASH_SOURCE[0]}")/.."
umask 077
install -d -m 0700 /var/backups/job-crm
target=$(mktemp "/var/backups/job-crm/crm-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX.dump.partial")
trap 'rm -f -- "$target"' EXIT
docker compose --env-file /etc/job-crm/production.env -f compose.production.yaml \
  exec -T db pg_dump -U crm -d crm -Fc > "$target"
docker compose --env-file /etc/job-crm/production.env -f compose.production.yaml \
  exec -T db pg_restore --list < "$target" > /dev/null
mv -- "$target" "${target%.partial}"
printf 'Backup created: %s\n' "${target%.partial}"
