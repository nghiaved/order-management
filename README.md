# Order Management

A full-featured **Order Management System** built with React, Tailwind CSS, and JSON Server. Features a dark-themed UI, role-based access control (RBAC), and complete CRUD operations for orders, products, inventory, and customers.

## Tech Stack

| Layer       | Technology                                       |
| ----------- | ------------------------------------------------ |
| Frontend    | React 19, React Router 7, Tailwind CSS 3         |
| Charts      | Recharts 3                                       |
| HTTP Client | Axios                                            |
| Backend API | JSON Server (mock REST API on port 8080)         |
| Build       | Create React App (react-scripts 5)               |

## Getting Started

```bash
# Install dependencies
npm install

# Start API server (port 8080)
npm run server

# Start development server (port 3000)
npm start
```

## Test Accounts

| Username  | Password     | Role       | Access                         |
| --------- | ------------ | ---------- | ------------------------------ |
| `admin`   | `admin123`   | Admin      | Full system access             |
| `manager` | `manager123` | Manager    | Orders + Customers (no delete) |
| `viewer`  | `viewer123`  | Read-Only  | View-only access               |

## Architecture

The codebase follows **Clean Architecture** principles with clear separation of concerns across layered modules. Each layer depends only on layers below it.

```
src/
├── constants/          # Shared constants (single source of truth)
│   └── index.js        # PAGE_SIZE, VAT_RATE, STATUS_CONFIG, PAYMENT_METHODS, SHIPPING_UNITS
│
├── utils/              # Pure functions (no side effects, no state)
│   ├── format.js       # fmt, fmtCurrency, fmtDate, fmtDateTime
│   ├── generate.js     # generateOrderId
│   └── rbacHelper.js   # PERMISSIONS map, hasPermission, hasAnyPermission
│
├── services/           # Data access layer (API abstraction)
│   ├── api.js          # Axios instance (baseURL: localhost:8080)
│   ├── authService.js  # login, getProfile
│   ├── orderService.js # CRUD + order details + status management
│   ├── productService.js
│   ├── customerService.js
│   └── inventoryService.js
│
├── contexts/           # React context (global state)
│   └── AuthContext.jsx # AuthProvider, useAuth hook
│
├── hooks/              # Reusable custom hooks
│   ├── useCrudPage.js  # Generic CRUD page state (data, filter, pagination, modal, delete)
│   └── usePermissions.js # canCreate/canRead/canEdit/canDelete for a resource
│
├── components/         # Shared UI components (presentation)
│   ├── Layout.jsx      # App shell: sidebar + header + content
│   ├── DataTable.jsx   # Generic data table with column config
│   ├── Pagination.jsx  # Page navigation controls
│   ├── Modal.jsx       # Modal + ConfirmModal
│   ├── CrudFormModal.jsx # Form modal + FormField + FormInput
│   ├── SearchFilter.jsx  # Search input + filter selects + result count
│   ├── Allow.jsx       # Permission-gated rendering
│   ├── ProtectedRoute.jsx # Route guard (auth + permission)
│   ├── OrderForm.jsx   # Complex order create/edit form
│   └── OrderList.jsx   # Orders table with status actions
│
├── pages/              # Route pages (composition layer)
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx   # Analytics: stat cards + recharts
│   ├── OrdersPage.jsx      # Orders listing
│   ├── OrderCreatePage.jsx  # /orders/create
│   ├── OrderUpdatePage.jsx  # /orders/update?id=...
│   ├── OrderDetailPage.jsx  # /orders/detail?id=...
│   ├── ProductsPage.jsx    # Products CRUD (uses useCrudPage)
│   ├── CustomersPage.jsx   # Customers CRUD (uses useCrudPage)
│   └── InventoryPage.jsx   # Inventory management
│
└── App.jsx             # Root: routing + lazy loading + permission gates
```

## Design Principles

### Single Responsibility (SRP)
- **Constants**: one module for all shared values (`PAGE_SIZE`, `STATUS_CONFIG`, etc.)
- **Format utilities**: one module for all locale formatting (`fmt`, `fmtCurrency`, `fmtDate`)
- **Services**: each service handles one API resource
- **Components**: each UI component handles one presentation concern

### Open/Closed (OCP)
- `useCrudPage` hook is extensible via configuration callbacks (`loadData`, `filterFn`, `formFromItem`, `payloadFromForm`) without modifying the hook itself
- `DataTable` renders any data shape via column config
- `SearchFilter` supports arbitrary filter dropdowns via `filters` array

### Dependency Inversion (DIP)
- Pages depend on **service abstractions** (e.g. `orderService.getAll()`) not raw API calls
- `DashboardPage` uses service layer instead of direct `axios` calls
- `useCrudPage` receives service functions as config, not concrete implementations

### DRY (Don't Repeat Yourself)
- `fmt()` was duplicated in 5 files → centralized in `utils/format.js`
- `STATUS_CONFIG`, `PAGE_SIZE`, `VAT_RATE` were duplicated → centralized in `constants/`
- CRUD state pattern (10+ useState hooks) was duplicated in 3 pages → extracted into `useCrudPage` hook
- Filter bar UI was duplicated in 4 pages → extracted into `SearchFilter` component

## Routes

| Path                  | Page              | Permission Required   |
| --------------------- | ----------------- | --------------------- |
| `/login`              | Login             | —                     |
| `/`                   | Dashboard         | `dashboard:read`      |
| `/orders`             | Orders list       | `orders:list`         |
| `/orders/create`      | Create order      | `orders:create`       |
| `/orders/update?id=`  | Edit order        | `orders:update`       |
| `/orders/detail?id=`  | Order detail      | `orders:read`         |
| `/products`           | Products CRUD     | `products:list`       |
| `/customers`          | Customers CRUD    | `customers:list`      |
| `/inventory`          | Inventory CRUD    | `inventory:list`      |

## RBAC System

Permissions follow the `resource:action` pattern:
- **Resources**: `orders`, `products`, `inventory`, `customers`, `users`, `dashboard`
- **Actions**: `create`, `read`, `update`, `delete`, `list`

Components use `<Allow permission="orders:create">` for conditional rendering and `<ProtectedRoute>` for route-level guards. The `usePermissions(resource)` hook provides `canCreate`, `canRead`, `canEdit`, `canDelete` booleans.

## Scripts

```bash
npm run server   # Start JSON Server on port 8080
npm start        # Start React dev server on port 3000
npm run build    # Production build
npm test         # Run tests
```
