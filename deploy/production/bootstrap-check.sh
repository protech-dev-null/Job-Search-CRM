#!/usr/bin/env bash
set -euo pipefail
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir/.."
for script in production/*.sh deploy/ssh-deploy-command.sh; do
  bash -n "$script"
done
python3 deploy/tests/test_ssh_command.py
