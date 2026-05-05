#!/bin/sh
set -eu

DATA_DIR="${FFIT_DATA_DIR:-/data/ffit}"

mkdir -p "$DATA_DIR"
chown -R nextjs:nodejs "$DATA_DIR"

exec gosu nextjs "$@"
