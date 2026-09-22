"""Read the mounted database credential before starting API or migrations."""

import os
import sys
from pathlib import Path
from urllib.parse import quote

password = Path('/run/secrets/db_password').read_text().strip()
if not password:
    raise SystemExit('Database password is empty')
os.environ['DATABASE_URL'] = (
    'postgresql+psycopg://crm:' + quote(password, safe='') + '@db:5432/crm'
)
os.execvp(sys.argv[1], sys.argv[1:])
