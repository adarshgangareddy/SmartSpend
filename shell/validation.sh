#!/bin/bash

# ------------------------------------------------------------
# INPUT VALIDATION
# ------------------------------------------------------------

validate_amount() {
	local amount="${1:-}"

	[[ "$amount" =~ ^[0-9]+(\.[0-9]{1,2})?$ ]] &&
		awk -v value="$amount" 'BEGIN { exit !(value > 0) }'
}

validate_date() {
	local value="${1:-}"

	[[ "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || return 1
	date -d "$value" '+%Y-%m-%d' >/dev/null 2>&1 || return 1
	[[ "$(date -d "$value" '+%Y-%m-%d' 2>/dev/null)" == "$value" ]]
}

validate_email() {
	local email="${1:-}"
	[[ "$email" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]]
}

validate_password() {
	local password="${1:-}"
	[[ ${#password} -ge 8 ]]
}
