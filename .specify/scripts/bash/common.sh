#!/usr/bin/env bash
# common.sh — shared helpers for specify scripts

get_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}
