#!/usr/bin/env bash
# Installed as /usr/local/sbin/job-crm-deploy; configuration stays on the VDS.
set -Eeuo pipefail
umask 077
[[ $EUID -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }
tag=${1:-}
[[ $# -eq 1 && $tag =~ ^sha-[0-9a-f]{40}-([0-9]{1,16})-([0-9]{1,6})$ ]] || {
  echo 'Expected sha-<40 hex commit>-<run id>-<attempt>.' >&2; exit 2;
}
run_id=${BASH_REMATCH[1]}
attempt=${BASH_REMATCH[2]}
cd /opt/job-crm
exec 9>/run/lock/job-crm-deploy.lock
flock -n 9 || { echo 'Another deployment is active.' >&2; exit 1; }
install -d -m 0700 /var/lib/job-crm /var/backups/job-crm
state=/var/lib/job-crm
if [[ -f $state/high-water ]]; then
  read -r last_run last_attempt < "$state/high-water"
  [[ $last_run =~ ^[0-9]{1,16}$ && $last_attempt =~ ^[0-9]{1,6}$ ]] || {
    echo 'Invalid deployment state; inspect high-water before continuing.' >&2; exit 1;
  }
  if (( 10#$run_id < 10#$last_run || (10#$run_id == 10#$last_run && 10#$attempt < 10#$last_attempt) )); then
    echo 'Refusing an older deployment. Use the documented manual rollback.' >&2
    exit 1
  fi
fi
for required in compose.production.yaml compose.ghcr.yaml /etc/job-crm/production.env /etc/job-crm/secrets/db_password /etc/job-crm/secrets/web_auth; do
  [[ -s $required ]] || { echo "Missing file: $required" >&2; exit 1; }
done
base=(docker compose --env-file /etc/job-crm/production.env -f compose.production.yaml)
current() { "${base[@]}" -f compose.ghcr.yaml "$@"; }
current config --quiet
domain=$(sed -n 's/^CRM_DOMAIN=//p' /etc/job-crm/production.env | tr -d '\r')
[[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+$ ]] || { echo 'CRM_DOMAIN must be a hostname.' >&2; exit 1; }

# Pull and freeze both image references before stopping the application.
repo=ghcr.io/protech-dev-null/job-search-crm
for service in api web; do docker pull "$repo/$service:$tag"; done
digest() {
  docker image inspect "$repo/$1:$tag" --format '{{range .RepoDigests}}{{println .}}{{end}}' |
    grep -E "^${repo}/$1@sha256:[0-9a-f]{64}$" | head -n 1
}
api_ref=$(digest api)
web_ref=$(digest web)
[[ -n $api_ref && -n $web_ref ]]
release_dir=$(mktemp -d "$state/release-${tag}-XXXXXX")
cp compose.production.yaml "$release_dir/compose.production.yaml"
cp /etc/job-crm/production.env "$release_dir/production.env"
cp compose.ghcr.yaml "$release_dir/previous.yaml"
printf 'services:\n  api:\n    image: %s\n  web:\n    image: %s\n' "$api_ref" "$web_ref" > "$release_dir/candidate.yaml"
candidate() { "${base[@]}" -f "$release_dir/candidate.yaml" "$@"; }
candidate config --quiet
backup="$release_dir/database.dump"
phase=before-stop
failed() {
  rc=$?
  trap - EXIT
  if (( rc != 0 )); then
    echo "Deployment failed at $phase. Recovery files: $release_dir" >&2
    if [[ $phase == backup ]]; then
      # No migration has started: the old application is still compatible.
      current up -d --no-deps --no-build --pull never --wait --wait-timeout 180 api web || true
    elif [[ $phase != before-stop ]]; then
      echo 'Database may have changed. No automatic database restore or image rollback.' >&2
    fi
  fi
  exit "$rc"
}
trap failed EXIT
printf '%s %s\n' "$run_id" "$attempt" > "$state/high-water.tmp"
mv "$state/high-water.tmp" "$state/high-water"
phase=backup
current stop web api
current exec -T db pg_dump -U crm -d crm -Fc > "$backup.partial"
current exec -T db pg_restore --list < "$backup.partial" > /dev/null
mv "$backup.partial" "$backup"
echo "Backup created: $backup"

phase=migration
candidate run --rm --no-deps --no-build --pull never api alembic upgrade head
phase=start
# Persist the selected configuration even if startup needs manual recovery.
cp "$release_dir/candidate.yaml" compose.ghcr.yaml.next
mv compose.ghcr.yaml.next compose.ghcr.yaml
current up -d --no-deps --no-build --pull never --wait --wait-timeout 180 api web
phase=verify
current exec -T api python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/stats', timeout=10)"
code=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --max-time 20 --resolve "$domain:443:127.0.0.1" "https://$domain/")
[[ $code == 401 ]] || { echo "Expected protected HTTPS endpoint (401), got $code" >&2; exit 1; }
printf '%s\n' "$tag" > "$state/current-release.tmp"
mv "$state/current-release.tmp" "$state/current-release"
current ps
echo "Deployment successful: $tag; recovery files: $release_dir"
