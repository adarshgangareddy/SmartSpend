
#!/bin/bash

# ============================================================
# SMARTSPEND - UNIX SHELL PROGRAMMING LAB
# Main CLI Controller
# ============================================================

# Resolve the directory containing this script
SHELL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


# ============================================================
# LOAD MODULES
# ============================================================

source "$SHELL_DIR/utils.sh"
source "$SHELL_DIR/validation.sh"
source "$SHELL_DIR/api.sh"
source "$SHELL_DIR/auth.sh"
source "$SHELL_DIR/transactions.sh"
source "$SHELL_DIR/analytics.sh"
source "$SHELL_DIR/admin.sh"


# ============================================================
# CONFIGURATION
# ============================================================

API_BASE_URL="${API_BASE_URL:-${API_URL:-http://127.0.0.1:8000/api}}"
HEALTH_CHECK_URL="${HEALTH_URL:-${API_BASE_URL%/}/health}"
SESSION_NOTICE="${SESSION_NOTICE:-}"


# ============================================================
# MAIN MENU
# ============================================================

guest_menu() {
    local choice

    while true; do

        print_header
        if [[ -n "$SESSION_NOTICE" ]]; then
            print_warning "$SESSION_NOTICE"
            SESSION_NOTICE=""
            echo
        fi

        print_dashboard_title "MAIN MENU"
        print_menu_item 1 "Login" "$GREEN"
        print_menu_item 2 "Exit" "$RED"
        echo

        read -r -p "${YELLOW}Enter your choice [1-2]: ${NC}" choice || exit 0

        case "$choice" in

            1)
                if login; then
                    return 10
                fi
                ;;

            2)
                echo
                print_success "Thank you for using SmartSpend!"
                exit 0
                ;;

            *)
                print_error "Invalid choice. Enter 1 or 2."
                pause_menu
                ;;

        esac

    done
}


# ============================================================
# NORMAL USER MENU
# ============================================================

user_menu() {
    local choice

    while true; do

        # If the session was invalidated by an API request, return to controller.
        if ! is_logged_in; then
            return
        fi

        print_header

        print_dashboard_title "USER DASHBOARD"
        printf '  %sSigned in:%s %s\n\n' "$DIM" "$NC" "$(get_user_email)"
        print_menu_section "TRANSACTIONS"
        print_menu_item 1 "View All Transactions"
        print_menu_item 2 "Add Income"
        print_menu_item 3 "Add Expense"
        print_menu_item 4 "View Financial Summary"
        print_menu_item 5 "Delete Transaction" "$RED"
        print_menu_section "ACCOUNT"
        print_menu_item 6 "Exit" "$RED"
        echo

        read -r -p "${YELLOW}Enter your choice [1-6]: ${NC}" choice || { logout; return 0; }

        case "$choice" in

            1)
                view_transactions
                ;;

            2)
                add_transaction "income"
                ;;

            3)
                add_transaction "expense"
                ;;

            4)
                view_summary
                ;;

            5)
                delete_transaction "" "no-list"
                ;;

            6)
                logout
                return
                ;;

            *)
                print_error "Invalid choice. Enter a number from 1 to 6."
                pause_menu
                ;;

        esac

    done
}


# ============================================================
# ADMIN MENU
# ============================================================

admin_menu() {
    local choice

    while true; do

        # If session is no longer available, return to controller
        if ! is_logged_in; then
            return
        fi

        print_header

        print_dashboard_title "ADMIN DASHBOARD"
        printf '  %sSigned in:%s %s\n\n' "$DIM" "$NC" "$(get_user_email)"
        print_menu_section "USER MANAGEMENT"
        print_menu_item 1 "View All Users"
        print_menu_item 2 "Add New User"
        print_menu_section "ACCOUNT"
        print_menu_item 3 "Remove User" "$RED"
        print_menu_item 4 "Exit" "$RED"
        echo

        read -r -p "${YELLOW}Enter your choice [1-4]: ${NC}" choice || { logout; return 0; }

        case "$choice" in

            1)
                view_all_users
                ;;

            2)
                add_user
                ;;

            3)
                remove_user
                ;;

            4)
                logout
                return
                ;;

            *)
                print_error "Invalid choice. Enter a number from 1 to 4."
                pause_menu
                ;;

        esac

    done
}


# ============================================================
# APPLICATION CONTROLLER
# ============================================================

main_menu() {
    local menu_status role

    while true; do
        # A saved token never skips the explicit login choice on application startup.
        guest_menu
        menu_status=$?
        [[ "$menu_status" -eq 10 ]] || continue

        role="$(get_user_role)"

        case "$role" in

            admin)
                admin_menu
                ;;

            user)
                user_menu
                ;;

            *)
                print_error "The backend did not return a valid user role. Please log in again."
                rm -f -- "$TOKEN_FILE"
                pause_menu
                ;;

        esac

    done
}


# ============================================================
# ENTRY POINT
# ============================================================

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then

    check_dependencies || exit 1
    main_menu

fi

