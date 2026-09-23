"""Exercise deployment failure boundaries with fake Docker, never a real VDS.

Run: python deploy/tests/test_deploy.py /path/to/bash
"""

import os
from pathlib import Path
import subprocess
import sys
import tempfile


BASH = sys.argv[1] if len(sys.argv) > 1 else "bash"
SOURCE = Path(__file__).resolve().parents[1] / "deploy-release.sh"
TAG = "sha-" + "a" * 40 + "-100-1"
STUBS = r'''
docker() {
  echo "$*" >> "$TEST_LOG"
  case "$*" in
    *" run "*"--no-build"*) echo 'unknown flag: --no-build' >&2; return 1 ;;
    "pull "*) [[ $SCENARIO != pull-failure ]] ;;
    "image inspect "*) printf '%s@sha256:%064d\n' "${3%%:*}" 1 ;;
    *"pg_dump "*) [[ $SCENARIO != backup-failure ]] && echo DUMP ;;
    *"pg_restore "*) cat >/dev/null ;;
    *"alembic upgrade head"*) [[ $SCENARIO != migration-failure ]] ;;
    *) return 0 ;;
  esac
}
curl() { if [[ $SCENARIO == https-failure ]]; then echo 502; else echo 401; fi; }
flock() { [[ $SCENARIO != locked ]]; }
install() { mkdir -p "${@:4}"; }
'''


def check(scenario):
    with tempfile.TemporaryDirectory(prefix="crm-deploy-test-", dir=SOURCE.parents[1]) as temporary:
        root = Path(temporary)
        app, config, state = root / "app", root / "etc", root / "state"
        for folder in (app, config / "secrets", state):
            folder.mkdir(parents=True, exist_ok=True)
        for name in ("compose.production.yaml", "compose.ghcr.yaml"):
            (app / name).write_text("original\n")
        (config / "production.env").write_text("CRM_DOMAIN=example.org\n")
        for name in ("db_password", "web_auth"):
            (config / "secrets" / name).write_text("test-only\n")
        if scenario == "stale":
            (state / "high-water").write_text("101 1\n", newline="\n")
        script = SOURCE.read_text(encoding="utf-8")
        script = script.replace(
            "[[ $EUID -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }", ":"
        )
        for original, replacement in {
            "/opt/job-crm": app,
            "/etc/job-crm": config,
            "/var/lib/job-crm": state,
            "/var/backups/job-crm": root / "backups",
            "/run/lock/job-crm-deploy.lock": root / "lock",
        }.items():
            script = script.replace(original, replacement.as_posix())
        test_script = root / "deploy.sh"
        test_script.write_text(STUBS + script, encoding="utf-8", newline="\n")
        log = root / "commands.log"
        env = dict(os.environ, SCENARIO=scenario, TEST_LOG=log.as_posix())
        result = subprocess.run(
            [BASH, test_script.as_posix(), TAG], env=env,
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        commands = log.read_text() if log.exists() else ""
        success = scenario == "success"
        assert (result.returncode == 0) == success, result.stdout + result.stderr
        assert (state / "current-release").exists() == success
        if scenario in ("pull-failure", "stale", "locked"):
            assert " stop web api" not in commands
        if scenario == "backup-failure":
            assert "alembic" not in commands
            assert " up -d" in commands
        if scenario == "migration-failure":
            assert " up -d" not in commands
            assert (app / "compose.ghcr.yaml").read_text() == "original\n"
        if success:
            assert commands.index("pg_dump") < commands.index("alembic") < commands.index(" up -d")
            assert "@sha256:" in (app / "compose.ghcr.yaml").read_text()
        print(f"PASS: {scenario}")


if __name__ == "__main__":
    for case in ("success", "pull-failure", "backup-failure", "migration-failure", "https-failure", "stale", "locked"):
        check(case)
