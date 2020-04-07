#!/bin/bash
set -e
set -x

M() {
    python3 manage.py "$@"
}
export DJANGO_DEV=1

#rm -rf tmp
#mkdir -p tmp

# https://makandracards.com/makandra/62111-how-to-drop-all-tables-in-postgresql
cat <<'EOF' | M dbshell
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
    EXECUTE 'DROP TABLE ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;
EOF

M showmigrations
rm -rf "tunesync/migrations/"
M showmigrations
M makemigrations
M makemigrations tunesync
M migrate auth
M migrate
M shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('system', 'admin@example.com', '.')"
rm -rf tunes/
clear
M runserver
