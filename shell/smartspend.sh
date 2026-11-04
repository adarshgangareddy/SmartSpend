#!/bin/bash
# ==============================================================================
# SmartSpend — Unix Shell Programming Lab CLI
# Interactive Bash interface for Smart Personal Expense Tracker
# Connects to FastAPI REST backend (persisted to Supabase PostgreSQL)
# ==============================================================================

# Default API Configuration (Can be overridden via API_URL environment variable)
API_BASE_URL="${API_URL:-http://127.0.0.1:8000/api}"
HEALTH_CHECK_URL="${HEALTH_URL:-http://127.0.0.1:8000/health}"

# ANSI Colors for clean terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# Dependency Verification
# ------------------------------------------------------------------------------
check_dependencies() {
    local missing=0

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}[ERROR] 'curl' is not installed.${NC}"
        missing=1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${RED}[ERROR] 'jq' is not installed.${NC}"
        missing=1
    fi

    if [ "$missing" -eq 1 ]; then
        echo -e "\nPlease install missing tools on Ubuntu Linux using:"
        echo -e "  ${YELLOW}sudo apt update && sudo apt install -y curl jq${NC}\n"
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# Backend API Connectivity Check
# ------------------------------------------------------------------------------
check_api_connection() {
    local health_response
    health_response=$(curl -s -m 3 "$HEALTH_CHECK_URL" 2>/dev/null)

    if [ -z "$health_response" ]; then
        echo -e "${RED}[ERROR] Cannot connect to SmartSpend API at:${NC} $API_BASE_URL"
        echo -e "${YELLOW}Please ensure your FastAPI backend is running:${NC}"
        echo -e "  cd backend"
        echo -e "  source .venv/bin/activate"
        echo -e "  uvicorn app.main:app --reload --port 8000\n"
        return 1
    fi
    return 0
}

# ------------------------------------------------------------------------------
# Helper: Validate Numeric Decimal Amounts
# ------------------------------------------------------------------------------
validate_amount() {
    local amt="$1"
    # Matches positive integers or decimals up to 2 decimal places (e.g., 250, 250.5, 250.50)
    if [[ "$amt" =~ ^[0-9]+(\.[0-9]{1,2})?$ ]]; then
        local is_positive
        is_positive=$(awk -v a="$amt" 'BEGIN { if (a > 0) print "1"; else print "0"; }' 2>/dev/null || echo "1")
        if [ "$is_positive" == "1" ]; then
            return 0
        fi
    fi
    return 1
}

# ------------------------------------------------------------------------------
# Helper: Validate Date Format (YYYY-MM-DD)
# ------------------------------------------------------------------------------
validate_date() {
    local dt="$1"
    if [[ "$dt" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        return 0
    else
        return 1
    fi
}

# ------------------------------------------------------------------------------
# 1. View All Transactions
# ------------------------------------------------------------------------------
view_transactions() {
    echo -e "\n${BOLD}${CYAN}--- ALL TRANSACTIONS ---${NC}"
    
    local response http_code body
    response=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/transactions")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ne 200 ]; then
        echo -e "${RED}[ERROR] Failed to fetch transactions (HTTP $http_code).${NC}"
        return
    fi

    local count
    count=$(echo "$body" | jq '. | length' 2>/dev/null)

    if [ -z "$count" ] || [ "$count" -eq 0 ]; then
        echo -e "${YELLOW}No transactions recorded yet in database.${NC}"
        return
    fi

    echo -e "${BOLD}Total Transactions: $count${NC}\n"
    printf "%-5s | %-12s | %-8s | %-16s | %-14s | %-30s\n" "ID" "DATE" "TYPE" "CATEGORY" "AMOUNT" "DESCRIPTION"
    printf "%s\n" "------+--------------+----------+------------------+----------------+-------------------------------"

    echo "$body" | jq -r '.[] | "\(.id)\t\(.transaction_date)\t\(.type)\t\(.category)\t\(.currency) \(.amount)\t\(.description // "-")"' | while IFS=$'\t' read -r id dt tx_type cat amt desc; do
        if [ "$tx_type" == "income" ]; then
            printf "%-5s | %-12s | ${GREEN}%-8s${NC} | %-16s | ${GREEN}%-14s${NC} | %-30s\n" "$id" "$dt" "$tx_type" "$cat" "+$amt" "$desc"
        else
            printf "%-5s | %-12s | ${RED}%-8s${NC} | %-16s | ${RED}%-14s${NC} | %-30s\n" "$id" "$dt" "$tx_type" "$cat" "-$amt" "$desc"
        fi
    done
    printf "%s\n" "------+--------------+----------+------------------+----------------+-------------------------------"
}

# ------------------------------------------------------------------------------
# 2 & 3. Add Transaction (Income or Expense)
# ------------------------------------------------------------------------------
add_transaction() {
    local tx_type="$1" # "income" or "expense"
    local title
    if [ "$tx_type" == "income" ]; then
        title="${GREEN}ADD NEW INCOME${NC}"
    else
        title="${RED}ADD NEW EXPENSE${NC}"
    fi

    echo -e "\n${BOLD}${title}"
    echo -e "----------------------------------------"

    # 1. Amount input
    local amount
    while true; do
        read -r -p "Enter Amount (> 0): " amount || return
        if validate_amount "$amount"; then
            break
        else
            echo -e "${RED}Invalid amount. Enter a positive number (e.g. 250 or 1500.50).${NC}"
        fi
    done

    # 2. Category input
    local category
    while true; do
        read -r -p "Enter Category (e.g., Food, Salary, Rent): " category || return
        category="$(echo "$category" | xargs)"
        if [ -n "$category" ]; then
            break
        else
            echo -e "${RED}Category cannot be empty.${NC}"
        fi
    done

    # 3. Description (optional)
    local description
    read -r -p "Enter Description (optional, press Enter to skip): " description || return
    description="$(echo "$description" | xargs)"

    # 4. Currency
    local currency
    read -r -p "Enter Currency [Default: INR]: " currency || return
    currency="$(echo "$currency" | xargs | tr '[:lower:]' '[:upper:]')"
    if [ -z "$currency" ]; then
        currency="INR"
    fi

    # 5. Transaction Date
    local default_date today_date tx_date
    default_date=$(date +%Y-%m-%d)
    while true; do
        read -r -p "Enter Date (YYYY-MM-DD) [Default: $default_date]: " tx_date || return
        tx_date="$(echo "$tx_date" | xargs)"
        if [ -z "$tx_date" ]; then
            tx_date="$default_date"
            break
        elif validate_date "$tx_date"; then
            break
        else
            echo -e "${RED}Invalid date format. Use YYYY-MM-DD (e.g., 2026-11-04).${NC}"
        fi
    done

    # Construct JSON payload using jq
    local payload
    payload=$(jq -n \
        --arg t "$tx_type" \
        --argjson a "$amount" \
        --arg c "$category" \
        --arg d "$description" \
        --arg cur "$currency" \
        --arg dt "$tx_date" \
        '{
            type: $t,
            amount: $a,
            category: $c,
            description: (if $d == "" then null else $d end),
            currency: $cur,
            transaction_date: $dt
        }')

    echo -e "\n${CYAN}Submitting transaction to database...${NC}"
    local response http_code body
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE_URL}/transactions" \
        -H "Content-Type: application/json" \
        -d "$payload")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 201 ]; then
        local created_id created_amt
        created_id=$(echo "$body" | jq -r '.id')
        created_amt=$(echo "$body" | jq -r '.amount')
        echo -e "${GREEN}✓ Transaction #$created_id created successfully! (${currency} $created_amt)${NC}"
    else
        local err_detail
        err_detail=$(echo "$body" | jq -r '.detail // "Unknown error"' 2>/dev/null)
        echo -e "${RED}[ERROR] Failed to create transaction (HTTP $http_code): $err_detail${NC}"
    fi
}

# ------------------------------------------------------------------------------
# 4. View Financial Summary
# ------------------------------------------------------------------------------
view_summary() {
    echo -e "\n${BOLD}${CYAN}--- FINANCIAL SUMMARY ---${NC}"

    local currency
    read -r -p "Enter Currency code to calculate [Default: INR]: " currency || return
    currency="$(echo "$currency" | xargs | tr '[:lower:]' '[:upper:]')"
    if [ -z "$currency" ]; then
        currency="INR"
    fi

    local response http_code body
    response=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/analytics/summary?currency=${currency}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ne 200 ]; then
        echo -e "${RED}[ERROR] Failed to fetch financial summary (HTTP $http_code).${NC}"
        return
    fi

    local income expenses balance
    income=$(echo "$body" | jq -r '.total_income')
    expenses=$(echo "$body" | jq -r '.total_expenses')
    balance=$(echo "$body" | jq -r '.balance')

    echo -e "\n========================================"
    echo -e "       FINANCIAL SUMMARY ($currency)"
    echo -e "========================================"
    printf "  Total Income   : ${GREEN}%12.2f %s${NC}\n" "$income" "$currency"
    printf "  Total Expenses : ${RED}%12.2f %s${NC}\n" "$expenses" "$currency"
    echo -e "----------------------------------------"
    local is_positive
    is_positive=$(awk -v b="$balance" 'BEGIN { if (b >= 0) print "1"; else print "0"; }' 2>/dev/null || echo "1")
    if [ "$is_positive" == "1" ]; then
        printf "  Net Balance    : ${GREEN}%12.2f %s${NC} (Savings)\n" "$balance" "$currency"
    else
        printf "  Net Balance    : ${RED}%12.2f %s${NC} (Deficit)\n" "$balance" "$currency"
    fi
    echo -e "========================================\n"
}

# ------------------------------------------------------------------------------
# 5. Delete Transaction
# ------------------------------------------------------------------------------
delete_transaction() {
    echo -e "\n${BOLD}${RED}--- DELETE TRANSACTION ---${NC}"

    # Prompt for transaction ID
    local tx_id
    read -r -p "Enter Transaction ID to delete: " tx_id || return
    tx_id="$(echo "$tx_id" | xargs)"

    if ! [[ "$tx_id" =~ ^[0-9]+$ ]] || [ "$tx_id" -le 0 ]; then
        echo -e "${RED}Invalid Transaction ID. Please enter a positive integer.${NC}"
        return
    fi

    # Confirm deletion
    local confirm
    read -r -p "Are you sure you want to permanently delete transaction #$tx_id? (y/N): " confirm || return
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deletion canceled.${NC}"
        return
    fi

    local response http_code body
    response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE_URL}/transactions/${tx_id}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Transaction #$tx_id deleted successfully from Supabase!${NC}"
    elif [ "$http_code" -eq 404 ]; then
        echo -e "${RED}[NOT FOUND] Transaction with ID #$tx_id does not exist.${NC}"
    else
        local err_detail
        err_detail=$(echo "$body" | jq -r '.detail // "Unknown error"' 2>/dev/null)
        echo -e "${RED}[ERROR] Failed to delete transaction (HTTP $http_code): $err_detail${NC}"
    fi
}

# ------------------------------------------------------------------------------
# Main Menu Loop
# ------------------------------------------------------------------------------
main_menu() {
    while true; do
        echo -e "================================"
        echo -e "       ${BOLD}SMARTSPEND CLI${NC}"
        echo -e "================================"
        echo -e "1. View All Transactions"
        echo -e "2. Add Income"
        echo -e "3. Add Expense"
        echo -e "4. View Financial Summary"
        echo -e "5. Delete Transaction"
        echo -e "6. Exit"
        echo -e "================================"

        local choice
        if ! read -r -p "Enter your choice [1-6]: " choice; then
            echo -e "\n${GREEN}Exiting SmartSpend CLI. Goodbye!${NC}\n"
            break
        fi

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
                delete_transaction
                ;;
            6)
                echo -e "\n${GREEN}Thank you for using SmartSpend CLI. Goodbye!${NC}\n"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please enter a number between 1 and 6.${NC}\n"
                ;;
        esac

        echo ""
        if ! read -r -p "Press [Enter] to return to menu..."; then
            break
        fi
        echo -e "\n----------------------------------------\n"
    done
}

# ------------------------------------------------------------------------------
# Script Entry Point
# ------------------------------------------------------------------------------
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_dependencies
    check_api_connection
    main_menu
fi
