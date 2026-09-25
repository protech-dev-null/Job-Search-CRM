"""Check the SSH protocol with fake downloads and systemd, without networking."""

import hashlib
import os
from pathlib import Path
import subprocess
import sys
import tempfile

BASH = sys.argv[1] if len(sys.argv) > 1 else "bash"
SOURCE = Path(__file__).resolve().parents[1] / "ssh-deploy-command.sh"
TAG = "sha-" + "a" * 40 + "-100-1"
STUBS = r'''
install() { mkdir -p "${@:4}"; }
curl() {
  [[ $SCENARIO != download-failure ]] || return 22
  while (( $# )); do
    if [[ $1 == --output ]]; then cp "$PAYLOAD" "$2"; return; fi
    shift
  done
  return 1
}
systemd_run() { echo "$*" > "$SYSTEMD_LOG"; }
'''


def check(case):
    with tempfile.TemporaryDirectory(prefix="crm-ssh-test-", dir=SOURCE.parents[1]) as directory:
        root = Path(directory)
        payload = root / "payload.sh"
        content = b"#!/bin/bash\necho deployed\n"
        if case == "syntax-failure":
            content = b"#!/bin/bash\nif then\n"
        payload.write_bytes(content)
        checksum = hashlib.sha256(content).hexdigest()
        if case == "checksum-failure":
            checksum = "0" * 64
        command = f"deploy-v2 {TAG} {checksum}"
        if case == "injection":
            command += "; echo unexpected"
        elif case == "legacy":
            command = f"deploy {TAG}"
        source = SOURCE.read_text(encoding="utf-8")
        source = source.replace("/var/lib/job-crm/scripts", (root / "scripts").as_posix())
        source = source.replace("exec /usr/bin/systemd-run", "systemd_run")
        script = root / "wrapper.sh"
        script.write_text(STUBS + source, encoding="utf-8", newline="\n")
        log = root / "systemd.log"
        env = dict(os.environ, SCENARIO=case, SSH_ORIGINAL_COMMAND=command,
                   PAYLOAD=payload.as_posix(), SYSTEMD_LOG=log.as_posix())
        result = subprocess.run([BASH, script.as_posix()], env=env,
                                capture_output=True, text=True, encoding="utf-8", errors="replace")
        assert (result.returncode == 0) == (case == "success"), result.stdout + result.stderr
        assert log.exists() == (case == "success")
        if log.exists():
            assert TAG in log.read_text()
        print(f"PASS: SSH {case}")


if __name__ == "__main__":
    for scenario in ("success", "checksum-failure", "syntax-failure", "download-failure", "injection", "legacy"):
        check(scenario)
