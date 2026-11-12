# SmartSpend — Unix Shell Architecture & Command Reference

> **Lab Presentation & Viva Reference Guide**  
> Complete documentation on how the SmartSpend CLI functions, its architectural components, and an exhaustive breakdown of every Unix command, utility, and Bash mechanism employed.

---

## 📑 Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [How It Works: End-to-End Execution Flow](#2-how-it-works-end-to-end-execution-flow)
3. [Script Modules Breakdown](#3-script-modules-breakdown)
4. [Master Commands & Utilities Reference](#4-master-commands--utilities-reference)
   - [External Unix Commands](#a-external-unix-commands)
   - [Bash Built-in Commands](#b-bash-built-in-commands)
   - [Special Shell Syntax & Operators](#c-special-shell-syntax--operators)
   - [Pipes, Redirection & Process Substitution](#d-pipes-redirection--process-substitution)
5. [In-Depth Code Snippets & Explanations](#5-in-depth-code-snippets--explanations)
6. [Security & Session Management](#6-security--session-management)
7. [Tomorrow's Presentation / Viva Cheat Sheet](#7-tomorrows-presentation--viva-cheat-sheet)

---

## 1. High-Level Overview

**SmartSpend** is a personal finance tracker with an interactive terminal interface built using pure Unix shell programming (Bash) for Ubuntu Linux. Rather than relying on simple local flat-file storage, it acts as a fully-featured **RESTful API client**, communicating over HTTP with a FastAPI backend connected to a Supabase (PostgreSQL) cloud database.

### Key Architectural Highlights
- **Live Cloud Backend Integration**: Defaults directly to the live deployed API (`https://smartspend-50r1.onrender.com/api`) so the CLI runs completely standalone on Linux without needing local backend or frontend servers running.
- **Modular Design**: Broken down into 8 specialized scripts, loaded dynamically via `source`.
- **Role-Based Access Control (RBAC)**: Distinguishes between `user` and `admin` roles, presenting custom dashboards.
- **Stateless REST Communication**: Communicates with the FastAPI backend using `curl` and parses JSON data using `jq`.
- **POSIX & Bash Best Practices**: Strict variable scoping (`local`), floating-point comparison via `awk`, regular expression validation via `[[ =~ ]]`, secure permissions via `umask`/`chmod`, and safe credential entry with `read -s`.

---

## 2. How It Works: End-to-End Execution Flow

```mermaid
flowchart TD
    A[smartspend.sh Entrypoint] --> B[check_dependencies: curl, jq, awk, date]
    B --> C[Guest Menu: 1. Login | 2. Exit]
    C -->|Choose Login| D[auth.sh: login]
    D -->|Read email & silent password| E[api.sh: POST /auth/login]
    E -->|Success 200 OK| F[Save JWT in ~/.config/smartspend/token.json with umask 077]
    F --> G[auth.sh: verify_session -> GET /auth/me]
    G --> H{User Role?}
    H -->|role == user| I[user_menu: Transactions & Analytics]
    H -->|role == admin| J[admin_menu: User Management]
    
    I --> I1[View / Add / Delete Transactions]
    I --> I2[View Financial Summary]
    I --> I3[Logout & Invalidate Session]
    
    J --> J1[View All Users]
    J --> J2[Create New User / Assign Role]
    J --> J3[Remove User]
    J --> J4[Logout & Invalidate Session]
```

### Step-by-Step Workflow

1. **Initialization (`smartspend.sh`)**:
   - The script determines its directory using `SHELL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`.
   - It verifies that required system binaries (`curl`, `jq`, `awk`, `date`) are installed using `command -v`.
   - It sources all modular scripts (`utils.sh`, `validation.sh`, `api.sh`, `auth.sh`, `transactions.sh`, `analytics.sh`, `admin.sh`).

2. **Guest Screen & Login (`guest_menu` & `auth.sh`)**:
   - Prompts the user for email and masked password (`read -s`).
   - Validates the email pattern with Bash regex before making network calls.
   - Constructs a JSON payload using `jq -n` and sends a `POST` request to `/api/auth/login`.
   - On success, saves the JWT bearer token to `~/.config/smartspend/token.json` with file mode `600` (read/write only by the owner).

3. **Role Determination (`verify_session` & `main_menu`)**:
   - Calls `GET /api/auth/me` to fetch the authoritative role from the backend database.
   - If `role == "admin"`, invokes `admin_menu()`.
   - If `role == "user"`, invokes `user_menu()`.

4. **Transaction Operations (`transactions.sh`)**:
   - **View**: Executes `GET /api/transactions`, loops through paginated results using process substitution (`< <(echo "$body" | jq -r ... @tsv)`), and prints formatted colored columns via `printf`.
   - **Add**: Prompts for amount, currency, category, optional description, and transaction date. Performs client-side validation, confirms details with the user, and sends `POST /api/transactions`.
   - **Delete**: Prompts for the transaction ID and requires explicit confirmation (`DELETE`) before sending `DELETE /api/transactions/{id}`.

5. **Analytics & Currency Conversion (`analytics.sh`)**:
   - Prompts the user to select their desired display currency (INR, USD, EUR, etc.).
   - Fetches calculated metrics from `GET /api/analytics/summary?currency={currency}`.
   - Parses `total_income`, `total_expenses`, and `balance` using `jq`.
   - Uses `awk` to determine whether the balance is non-negative (Savings) or negative (Deficit) and outputs formatted financial statistics.

6. **Admin User Management (`admin.sh`)**:
   - Admin users can list all registered users (paginated), create new user/admin accounts, update credentials, or delete user accounts by UUID.

---

## 3. Script Modules Breakdown

| Script File | Purpose & Responsibilities | Key Functions |
| :--- | :--- | :--- |
| **`smartspend.sh`** | Main entrypoint and controller; loads all modules, orchestrates routing based on RBAC. | `main_menu`, `guest_menu`, `user_menu`, `admin_menu` |
| **`utils.sh`** | Visual presentation, terminal detection, color palette, formatted headers, and dependency checking. | `print_header`, `print_dashboard_title`, `print_menu_item`, `check_dependencies`, `pause_menu` |
| **`validation.sh`** | Strict input validators for amounts, dates, emails, and passwords. | `validate_amount`, `validate_date`, `validate_email`, `validate_password` |
| **`api.sh`** | Central HTTP client; wraps `curl`, handles headers, auth tokens, status code separation, and connection errors. | `api_request`, `check_api_connection`, `api_status`, `api_body` |
| **`auth.sh`** | Local token lifecycle; manages JWT storage, login, session validation, role retrieval, and logout. | `login`, `verify_session`, `is_logged_in`, `save_token`, `logout`, `get_access_token` |
| **`transactions.sh`** | User transaction workflows; fetching, tabular rendering, input prompts, confirmation dialogs, and deletion. | `view_transactions`, `add_transaction`, `delete_transaction`, `update_account`, `delete_account` |
| **`analytics.sh`** | Financial summaries; currency picker, income/expense/net balance computation, and surplus/deficit detection. | `view_summary` |
| **`admin.sh`** | Administrative workflows; user listing with pagination, account creation, account editing, and account deletion. | `view_all_users`, `add_user`, `update_user`, `remove_user` |

---

## 4. Master Commands & Utilities Reference

This section catalogs every command, utility, and shell syntax used throughout the project.

### A. External Unix Commands

#### 1. `curl` — HTTP REST Client
Used to communicate with the FastAPI backend.
- `--silent` (`-s`): Disables the progress meter and auxiliary messages.
- `--show-error`: Ensures that if an HTTP or connection error occurs, the error message is displayed.
- `--connect-timeout 15`: Aborts if connection establishment takes more than 15 seconds (allows cloud services like Render to wake up from cold sleep).
- `--max-time 45`: Maximum total time allowed for the request.
- `--write-out $'\n%{http_code}'`: Appends the 3-digit HTTP status code on a newline after the response body.
- `--request <METHOD>`: Specifies the HTTP verb (`GET`, `POST`, `PUT`, `DELETE`).
- `--header`: Adds HTTP request headers (`Authorization: Bearer <token>`, `Content-Type: application/json`).
- `--data <payload>`: Sends the JSON request payload.

#### 2. `jq` — Command-line JSON Processor
Used to construct payloads, parse responses, and slice data structures.
- `jq -n`: Creates JSON from scratch without reading standard input.
- `--arg <key> <val>`: Safely passes a shell variable into `jq` as a JSON string (prevents injection vulnerabilities).
- `--argjson <key> <val>`: Passes a shell variable into `jq` as a native JSON number or boolean.
- `jq -r`: Raw output mode (removes enclosing JSON quotes around strings).
- `jq -e`: Sets exit status based on output (returns non-zero if result is `false` or `null`).
- `@tsv`: Formats an array of values into a tab-separated line, ideal for parsing with `read -r`.
- `jq -c`: Compact output mode (prints each object on a single line).

#### 3. `awk` — Numeric Evaluation & Text Processing
Used specifically for floating-point comparisons, which standard Bash integer arithmetic cannot perform.
- `awk -v value="$amount" 'BEGIN { exit !(value > 0) }'`: Evaluates whether the floating-point amount is greater than zero.
- `awk -v b="$balance" 'BEGIN { exit !(b >= 0) }'`: Tests if the net balance is non-negative to toggle between "Savings" and "Deficit".

#### 4. `date` — Calendar Date Validation & Current Date
- `date +%Y-%m-%d`: Formats today's date in ISO 8601 standard format.
- `date -d "$value" '+%Y-%m-%d'`: Validates that a user-entered date is a real calendar date (e.g., rejects `2026-02-31`).

#### 5. `mkdir`, `chmod`, `umask` — Filesystem Security
- `mkdir -p "$token_dir"`: Creates directory hierarchies without throwing errors if they already exist.
- `umask 077`: Restricts file creation permissions so that newly created files are only readable and writable by the current user (`-rw-------`).
- `chmod 700 "$token_dir"`: Sets read, write, and execute permissions exclusively for the owner on the directory.
- `chmod 600 "$file"`: Sets read and write permissions exclusively for the owner on the token file.

#### 6. `mv` & `rm` — File Operations
- `mv -f -- "$temp_file" "$TOKEN_FILE"`: Atomically replaces the old token file with the newly written file.
- `rm -f -- "$TOKEN_FILE"`: Deletes the stored session token upon logout or session expiry.

#### 7. `tail` & `cut` — Stream Parsing
- `tail -n 1`: Extracts the last line of the `curl` response (the HTTP status code appended by `--write-out`).
- `cut -d'T' -f1`: Splits ISO 8601 timestamps (e.g. `2026-11-12T18:30:00Z`) at the `T` character to show only the date portion.

#### 8. `clear` — Screen Management
- `clear`: Clears the terminal screen before rendering menus, only when standard output is an active interactive terminal (`[[ -t 1 ]]`).

---

### B. Bash Built-in Commands

- `source <file>` (or `. <file>`): Executes commands from another shell file in the current shell environment, enabling modular code reuse.
- `read`: Reads a line from standard input.
  - `-r`: Disables backslash escape interpretation (raw input).
  - `-p "prompt"`: Outputs the prompt string before reading.
  - `-s`: Suppresses terminal echo (silent input, used for passwords).
- `printf`: Produces formatted output according to format specifiers (e.g. `%-8s %-12s %12.2f`).
  - `printf -v <var>`: Stores formatted text directly into a variable instead of printing to the terminal.
- `local`: Confines variable scope to the executing function, preventing namespace pollution and variable collisions.
- `declare`:
  - `declare -F <func>`: Tests whether a specific function exists in the current environment.
  - `declare -a`: Declares an indexed array.
- `command -v <binary>`: Locates an executable in the user's `$PATH` without running it; used for dependency checks.
- `unset <var>`: Removes variables from memory immediately (used to clear sensitive passwords).
- `exit <code`> / `return <code>`: Terminates the script or returns an exit code from a function.

---

### C. Special Shell Syntax & Operators

#### 1. Parameter Expansion
- `${var:-default}`: If `var` is unset or null, uses `default` (e.g. `tx_date="${tx_date:-$(date +%Y-%m-%d)}"`).
- `${var%/}`: Strips trailing slash from URLs (e.g. `${API_BASE_URL%/}`).
- `${var//search/replace}`: Replaces all occurrences of `search` with `replace` (e.g. `${border// /═}`).
- `${#var}`: Evaluates the character length of a string (e.g. `${#password} -ge 8`).
- `${var^^}`: Converts string to uppercase (e.g. `${currency^^}`).

#### 2. Regular Expression Matching (`[[ =~ ]]`)
Used extensively in `validation.sh`:
- Amount check: `[[ "$amount" =~ ^[0-9]+(\.[0-9]{1,2})?$ ]]` (ensures positive integer or decimal with up to 2 decimal places).
- Date check: `[[ "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]` (validates `YYYY-MM-DD` structure).
- Email check: `[[ "$email" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]]` (ensures standard email format).
- UUID check: `[[ "$user_id" =~ ^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$ ]]` (validates UUID format for admin user removal).

#### 3. Arrays
- Definition: `currencies=("INR" "USD" "EUR" "GBP")`
- Iteration by indices: `for index in "${!currencies[@]}"; do ... done`
- Length of array: `${#currencies[@]}`
- Accessing element: `${currencies[$((choice - 1))]}`

#### 4. Arithmetic Expansion
- `$(( expression ))`: Evaluates integer math expressions (e.g. `left=$((padding / 2))`).
- `(( condition ))`: Arithmetic conditional evaluation (e.g. `(( index > total ))`).

---

### D. Pipes, Redirection & Process Substitution

- **Standard Redirection (`>/dev/null 2>&1`)**:
  Suppresses both standard output (`1`) and standard error (`2`) for clean background checks.
- **Terminal Detection (`[[ -t 1 ]]`)**:
  Tests file descriptor 1 to determine if output is directed to a real terminal screen. If redirected to a file or pipe, ANSI color formatting is automatically disabled.
- **Process Substitution (`< <(...)`)**:
  Feeds the output of a command directly into a loop as a stream without spawning a subshell:
  ```bash
  while IFS=$'\t' read -r id tx_date tx_type category amount currency description; do
      ...
  done < <(echo "$body" | jq -r '.[] | [.id, .transaction_date, .type, .category, .amount, .currency, (.description // "-")] | @tsv')
  ```
  *Why this matters:* Using `echo "$body" | while read ...` runs the loop in a subshell, losing variable changes made inside the loop. `< <(...)` runs the loop in the current shell process.

---

## 5. In-Depth Code Snippets & Explanations

### 1. HTTP Request Execution and Status Extraction (`api.sh`)
```bash
local -a curl_args=(--silent --show-error --connect-timeout 5 --max-time 20
    --write-out $'\n%{http_code}' --request "$method" "${API_BASE_URL%/}${endpoint}")

if [[ -n "$token" ]]; then
    curl_args+=(--header "Authorization: Bearer ${token}")
fi
if [[ -n "$data" ]]; then
    curl_args+=(--header 'Content-Type: application/json' --data "$data")
fi

response=$(curl "${curl_args[@]}" 2>/dev/null)
```
- **Explanation**: Prepares an array of arguments for `curl`. By specifying `--write-out $'\n%{http_code}'`, `curl` outputs the response body followed by a newline and the HTTP code.
- **Status extraction**:
  ```bash
  api_status() {
      printf '%s\n' "$1" | tail -n 1
  }
  api_body() {
      if [[ "$1" == *$'\n'* ]]; then
          printf '%s' "${1%$'\n'*}"
      fi
  }
  ```
  `tail -n 1` extracts the status code, and parameter expansion `${1%$'\n'*}` removes the status code, leaving the clean JSON body.

---

### 2. Password Masking and Memory Cleanup (`auth.sh`)
```bash
read -r -s -p "Password : " password || return 1
echo

payload=$(jq -n \
    --arg email "$email" \
    --arg password "$password" \
    '{email: $email, password: $password}')

unset password  # Securely erases the raw password from shell memory
```
- **Explanation**: `-s` prevents the password characters from echoing on the monitor. `jq -n --arg` escapes special characters, preventing shell and JSON injection. `unset password` ensures that the plaintext password does not linger in memory.

---

### 3. Floating-Point Amount Validation (`validation.sh`)
```bash
validate_amount() {
    local amount="${1:-}"

    [[ "$amount" =~ ^[0-9]+(\.[0-9]{1,2})?$ ]] &&
        awk -v value="$amount" 'BEGIN { exit !(value > 0) }'
}
```
- **Explanation**: Bash does not support floating-point mathematics natively (e.g. `(( 12.50 > 0 ))` causes a syntax error). First, a regex ensures the format is a valid integer or 1-2 decimal number. Second, `awk` runs in a lightweight subshell to verify that `value > 0`.

---

### 4. Dynamic Box and Header Drawing (`utils.sh`)
```bash
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
```
- **Explanation**: Dynamically calculates the center alignment of any title string inside a 58-character wide box. `printf '═%.0s' {1..58}` repeats the box-drawing character 58 times without external loops.

---

## 6. Security & Session Management

1. **Token Storage**:
   Stored at `~/.config/smartspend/token.json`.
2. **Directory Isolation**:
   ```bash
   mkdir -p "$token_dir"
   chmod 700 "$token_dir"
   ```
   Ensures no other user on a shared Linux machine can access the folder.
3. **Atomic Writes with `umask`**:
   ```bash
   (umask 077; printf '%s\n' "$response" | jq '.' > "$temp_file")
   chmod 600 "$temp_file" && mv -f -- "$temp_file" "$TOKEN_FILE"
   ```
   Writes to a temporary process-tagged file (`.tmp.$$`) with `umask 077` and renames it atomically to eliminate race conditions and window-of-vulnerability file inspection.
4. **Automatic Expiry Handling**:
   When any protected API endpoint returns `401 Unauthorized`, `api.sh` automatically deletes `$TOKEN_FILE` and redirects the user back to the login screen with a session notice.

---

## 7. Tomorrow's Presentation / Viva Cheat Sheet

When presenting your shell project, use these structured talking points:

### 2-Minute Elevator Pitch
> *"SmartSpend is a personal finance tracker engineered for Unix/Linux environments. Rather than using local flat files, our CLI functions as a modular Bash client that integrates with a live FastAPI REST API and Supabase PostgreSQL database. We modularized the system into 8 distinct scripts for authentication, transactions, analytics, administration, and validation. The implementation strictly uses POSIX and Bash standards: we use `curl` for HTTP network traffic, `jq` for JSON construction and deserialization, `awk` for floating-point calculations, Bash regular expressions for data validation, and `umask`/`chmod` for secure token storage."*

---

### Top 10 Expected Questions & Model Answers

#### Q1: Why did you split the project into multiple `.sh` files instead of one big script?
**Answer**: Modularity and separation of concerns. By separating code into `api.sh`, `auth.sh`, `transactions.sh`, `analytics.sh`, and `admin.sh`, each module has a single responsibility. This makes the code maintainable, testable, and allows modules to be sourced independently.

#### Q2: Why use `awk` instead of Bash arithmetic like `$(( ... ))`?
**Answer**: Bash built-in arithmetic only handles integer calculations. Since financial calculations involve decimals (e.g. `1249.50`), attempting arithmetic on floats in Bash results in a syntax error. We used `awk` because it supports IEEE 754 floating-point operations natively.

#### Q3: How do you handle HTTP requests and JSON data in Bash?
**Answer**: We use `curl` as our HTTP client with options like `--silent`, `--request`, and `--write-out` to capture both the body and status code. For JSON, we use `jq`. To avoid command injection, we use `jq --arg key value` instead of string interpolation.

#### Q4: How does the script know whether to show the Admin or User dashboard?
**Answer**: After logging in, `auth.sh` calls `GET /auth/me` with the bearer token. The backend verifies the token and returns the user's profile and database role. The script extracts the role using `jq` and routes execution through a `case` statement in `smartspend.sh` to either `admin_menu` or `user_menu`.

#### Q5: How is user password entry kept secure?
**Answer**: We use `read -s -p`, which disables local terminal character echo. Once the JSON payload is constructed via `jq`, we immediately invoke `unset password` to purge the plaintext password from shell memory.

#### Q6: What is process substitution `< <(...)` and why did you use it?
**Answer**: When iterating over tabular transaction records, piping `cat file | while read` creates a subshell, meaning variables modified inside the loop lose their scope when the loop exits. Using `< <(jq ... @tsv)` runs the `while read` loop in the current process while streaming the parsed records directly.

#### Q7: How do you protect the authentication token stored on disk?
**Answer**: We set the directory permissions to `700` (`drwx------`) and use `umask 077` and `chmod 600` (`-rw-------`) when writing `token.json`. This guarantees that no other user on the multi-user Unix system can read or tamper with the JWT token.

#### Q8: How did you separate the HTTP status code from the response body in `curl`?
**Answer**: We used `curl --write-out $'\n%{http_code}'`. This forces `curl` to print the response body, followed by a newline, followed by the 3-digit status code (like `200` or `401`). Then `tail -n 1` grabs the status code, and parameter expansion `${response%$'\n'*}` extracts the body.

#### Q9: What happens if the backend server is down when the user runs the script?
**Answer**: In `api.sh`, `curl` runs with `--connect-timeout 5`. If `curl` exits with a non-zero exit code or fails to connect, the script catches it, assigns a virtual HTTP status `000`, outputs a friendly error message, and avoids crashing.

#### Q10: How do you ensure the required tools are present before the script runs?
**Answer**: In `utils.sh`, `check_dependencies()` iterates through an array of required commands (`curl`, `jq`, `awk`, `date`) and tests each using `command -v <tool> >/dev/null 2>&1`. If any tool is missing, it alerts the user and halts execution before any errors can occur.

