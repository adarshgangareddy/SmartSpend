
#!/bin/bash

# ============================================================
# SMARTSPEND - COMMON UTILITY FUNCTIONS
# ============================================================

# Terminal colors are disabled for redirected output and when NO_COLOR is set.
RESET=''
NC=''
BOLD=''
RED=''
GREEN=''
YELLOW=''
BLUE=''
MAGENTA=''
CYAN=''
WHITE=''
DIM=''

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
    RESET=$'\033[0m'
    NC="$RESET"
    BOLD=$'\033[1m'
    RED=$'\033[0;31m'
    GREEN=$'\033[0;32m'
    YELLOW=$'\033[1;33m'
    BLUE=$'\033[0;34m'
    MAGENTA=$'\033[0;35m'
    CYAN=$'\033[0;36m'
    WHITE=$'\033[0;37m'
    DIM=$'\033[2m'
fi


# ------------------------------------------------------------
# 1. APPLICATION HEADER
# ------------------------------------------------------------

print_header() {
    if [[ -t 1 ]] && command -v clear >/dev/null 2>&1; then
        clear
    fi

    local border_width=100 border
    printf -v border '%*s' "$border_width" ''
    border="${border// /═}"
    printf '%s╔%s╗%s\n' "$CYAN" "$border" "$NC"
    echo -e "${BOLD}${MAGENTA}"
    echo "  ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗     ███████╗██████╗ ███████╗███╗   ██╗██████╗"
    echo "  ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝     ██╔════╝██╔══██╗██╔════╝████╗  ██║██╔══██╗"
    echo "  ███████╗██╔████╔██║███████║██████╔╝   ██║        ███████╗██████╔╝█████╗  ██╔██╗ ██║██║  ██║"
    echo "  ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║        ╚════██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║  ██║"
    echo "  ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║        ███████║██║     ███████╗██║ ╚████║██████╔╝"
    echo "  ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝        ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═══╝╚═════╝"
    echo -e "${NC}"
    echo -e "${CYAN}                 SMART PERSONAL EXPENSE TRACKER${NC}"
    printf '%s╚%s╝%s\n\n' "$CYAN" "$border" "$NC"
}


# ------------------------------------------------------------
# 2. HORIZONTAL LINE
# ------------------------------------------------------------

print_line() {
    printf '  %s%s%s\n' "$CYAN" '----------------------------------------------' "$NC"
}

print_dashboard_title() {
    local title="$1"
    local width=58
    local padding=$((width - ${#title}))
    local left=$((padding / 2))
    local right=$((padding - left))

    printf '%s╔%s╗%s\n' "$CYAN" "$(printf '═%.0s' {1..58})" "$NC"
    printf '%s║%*s%s%s%s%*s║%s\n' "$CYAN" "$left" '' "$BOLD$CYAN" "$title" "$NC$CYAN" "$right" '' "$NC"
    printf '%s╚%s╝%s\n' "$CYAN" "$(printf '═%.0s' {1..58})" "$NC"
}

print_menu_section() {
    printf '\n%s%s%s\n\n' "$BOLD$MAGENTA" "$1" "$NC"
}

print_menu_item() {
    local number="$1"
    local label="$2"
    local color="${3:-$WHITE}"

    printf '  %s[%s%2s%s]%s %s%s%s\n' \
        "$YELLOW" "$BOLD" "$number" "$YELLOW" "$NC" "$color" "$label" "$NC"
}

print_success() { printf '%s[SUCCESS]%s %s\n' "$GREEN" "$NC" "$1"; }
print_error() { printf '%s[ERROR]%s %s\n' "$RED" "$NC" "$1"; }
print_warning() { printf '%s[WARNING]%s %s\n' "$YELLOW" "$NC" "$1"; }
print_info() { printf '%s[INFO]%s %s\n' "$CYAN" "$NC" "$1"; }


# ------------------------------------------------------------
# 3. PAUSE MENU
# ------------------------------------------------------------

pause_menu() {

    echo
    read -r -p "${YELLOW}Press Enter to continue...${NC}" || true

}


# ------------------------------------------------------------
# 4. CHECK REQUIRED DEPENDENCIES
# ------------------------------------------------------------

check_dependencies() {

    local missing=0

    local commands=("curl" "jq" "awk" "date")

    for command in "${commands[@]}"; do

        if ! command -v "$command" >/dev/null 2>&1; then
            echo -e "${RED}✘ ${command} is not installed${NC}"
            missing=1
        fi

    done

    if [[ "$missing" -eq 1 ]]; then

        echo
        echo -e "${RED}Please install the missing dependencies before continuing.${NC}"

        return 1

    fi

    return 0

}

