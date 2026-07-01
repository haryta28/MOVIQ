#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Moviq is an OOH / vehicle-branding intelligence platform (gOGig-style). It has 3 parts:
    1) Admin Dashboard  2) Agency Dashboard  3) WhatsApp Bot (field executive vehicle registration)
  Backend built with FastAPI + MongoDB + JWT. Frontend integrated with real APIs.
  Seeded admin: admin@moviq.in / demo1234
  Seeded agency: saurav@brightads.in / demo1234  (agencyId=a1)

backend:
  - task: "Auth (POST /api/auth/login, GET /api/auth/me)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "JWT-based login, bcrypt password hashing. Seeded 2 users on startup. /me returns current user from token."
      - working: true
        agent: "testing"
        comment: "✅ All auth tests passed: Admin login (admin@moviq.in) returns JWT+user with role=admin. Agency login (saurav@brightads.in) returns JWT+user with role=agency, agencyId=a1. Invalid password correctly returns 401. GET /auth/me with valid token returns user. GET /auth/me without token returns 401."

  - task: "Agencies (GET, POST, GET by id)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "6 agencies seeded. Admin can create new via POST. GET requires auth."
      - working: true
        agent: "testing"
        comment: "✅ All agencies tests passed: GET /agencies returns 6 seeded agencies. POST /agencies as admin successfully creates new agency. POST /agencies as agency user correctly returns 403. GET /agencies/a1 returns BrightAds Media."

  - task: "Campaigns (GET, POST) with agency scoping"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "6 campaigns seeded. Agency-role users only see own; admin sees all. Agency-only POST."
      - working: true
        agent: "testing"
        comment: "✅ All campaigns tests passed: GET /campaigns as admin returns all campaigns (>=6). GET /campaigns as agency returns only agencyId=a1 campaigns (2 items). GET /campaigns?agency_id=a2 correctly filters to a2 campaigns. POST /campaigns as agency creates campaign under agencyId=a1. POST /campaigns as admin correctly returns 403."

  - task: "Tasks (GET with filters)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "40 tasks seeded with agencyId. Filters: agency_id, status_, city. Agency users scoped."
      - working: true
        agent: "testing"
        comment: "✅ All tasks tests passed: GET /tasks as admin returns all 40 tasks. GET /tasks as agency returns only agencyId=a1 tasks. GET /tasks?status_=flagged correctly filters by status. GET /tasks?city=Bengaluru correctly filters by city."

  - task: "Fraud Alerts (GET, POST resolve)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "5 seeded. Resolving deletes the alert."
      - working: true
        agent: "testing"
        comment: "✅ All fraud alerts tests passed: GET /fraud-alerts returns alerts (>=5). POST /fraud-alerts/f1/resolve returns {ok:true} and alert is removed from subsequent GET. POST /fraud-alerts/nonexistent/resolve correctly returns 404."

  - task: "Media Types CRUD"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "12 seeded. Admin-only POST/DELETE. Duplicate key returns 409."
      - working: true
        agent: "testing"
        comment: "✅ All media types tests passed: GET /media-types returns types (>=12). POST /media-types as admin creates 'Airport Advertising'. POST /media-types as agency correctly returns 403. POST duplicate media type correctly returns 409. DELETE /media-types/{key} as admin works. DELETE as agency correctly returns 403. DELETE nonexistent key correctly returns 404."

  - task: "Vehicle Submissions (public POST, auth GET)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST is public - used by WhatsApp bot (no auth). GET requires auth."
      - working: true
        agent: "testing"
        comment: "✅ All vehicle submissions tests passed: POST /vehicle-submissions without auth works (public endpoint for WhatsApp bot). GET /vehicle-submissions without auth correctly returns 401. GET /vehicle-submissions with auth returns list including the test submission."

  - task: "Users (GET by role)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Role filter: admin (hardcoded 3), agency (from agencies collection), supervisor (3 seeded), field (6 seeded)."
      - working: true
        agent: "testing"
        comment: "✅ All users tests passed: GET /users?role=field returns 6 field executives. GET /users?role=supervisor returns 3 supervisors. GET /users?role=admin returns 3 hardcoded admins. GET /users?role=agency returns agency users derived from agencies collection (>=6)."

  - task: "Analytics Overview"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns monthlyStats, cityStats, and computed kpis (agency-scoped for role=agency)."
      - working: true
        agent: "testing"
        comment: "✅ All analytics tests passed: GET /analytics/overview as admin returns correct structure with monthlyStats (6 items), cityStats (8 items), and kpis object with all required keys (activeAgencies, liveCampaigns, tasksExecuted, totalTasks, totalRevenue). GET /analytics/overview as agency returns same structure with agency-scoped kpis."

  - task: "Notifications, Brands (GET)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Simple list endpoints."
      - working: true
        agent: "testing"
        comment: "✅ All notifications/brands tests passed: GET /notifications returns 4 items. GET /brands returns 6 items."

  - task: "RBAC (admin-only routes reject agency)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "require_admin dependency used on POST /agencies, POST /media-types, DELETE /media-types."
      - working: true
        agent: "testing"
        comment: "✅ All RBAC tests passed: POST /agencies as agency returns 403. POST /media-types as agency returns 403. DELETE /media-types as agency returns 403. All admin-only routes correctly reject agency users."

frontend:
  - task: "Full-stack integration (all pages)"
    implemented: true
    working: "NA"
    file: "frontend/src/**"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Every admin/agency page fetches from /api. WhatsApp bot POSTs to /vehicle-submissions. Auth via JWT."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Backend built and seeded. Please test all endpoints under /api using:
        admin login: admin@moviq.in / demo1234
        agency login: saurav@brightads.in / demo1234 (agencyId=a1)
      Verify:
        - Login returns JWT + user
        - Protected routes reject missing/invalid tokens (401)
        - RBAC: POST /agencies, POST /media-types, DELETE /media-types are admin-only (agency should get 403)
        - Campaigns/Tasks are scoped for agency role (only agencyId=a1 rows)
        - Vehicle submissions POST works without auth; GET requires auth
        - Fraud resolve deletes the alert
      Backend base URL is the standard REACT_APP_BACKEND_URL from frontend/.env (server binds 0.0.0.0:8001).
  - agent: "testing"
    message: |
      ✅ COMPREHENSIVE BACKEND TESTING COMPLETE - ALL 39 TESTS PASSED (100% SUCCESS RATE)
      
      Created /app/backend_test.py and tested all endpoints at https://video-replica-ai.preview.emergentagent.com/api
      
      Test Results Summary:
      ✅ Auth (5/5 tests): Login with valid/invalid creds, /me with/without token - ALL WORKING
      ✅ Agencies (4/4 tests): GET list, POST as admin/agency, GET by id - ALL WORKING
      ✅ Campaigns (5/5 tests): GET as admin/agency, filtering, POST with RBAC - ALL WORKING
      ✅ Tasks (4/4 tests): GET as admin/agency, filter by status/city - ALL WORKING
      ✅ Users (4/4 tests): GET by role (field/supervisor/admin/agency) - ALL WORKING
      ✅ Fraud Alerts (3/3 tests): GET, resolve existing/nonexistent - ALL WORKING
      ✅ Media Types (7/7 tests): GET, POST/DELETE with RBAC, duplicate handling - ALL WORKING
      ✅ Vehicle Submissions (3/3 tests): Public POST, auth GET - ALL WORKING
      ✅ Analytics (2/2 tests): Overview as admin/agency with correct structure - ALL WORKING
      ✅ Notifications & Brands (2/2 tests): GET endpoints - ALL WORKING
      
      Key Validations Confirmed:
      - JWT authentication working correctly for both admin and agency users
      - RBAC properly enforced (admin-only routes return 403 for agency users)
      - Agency scoping working (agency users only see their own campaigns/tasks)
      - All filters (agency_id, status_, city) working correctly
      - Public endpoints (vehicle submissions POST) accessible without auth
      - Protected endpoints return 401 without valid token
      - Error handling correct (404 for not found, 409 for duplicates)
      
      NO ISSUES FOUND. Backend API is fully functional and ready for production.
