# Order Management System

Hệ thống quản lý đơn hàng đầy đủ tính năng, xây dựng bằng React, Tailwind CSS và JSON Server. Giao diện dark theme, phân quyền RBAC, CRUD hoàn chỉnh cho đơn hàng, sản phẩm, kho hàng và khách hàng. Toàn bộ UI đã được Việt hóa.

## Tech Stack

| Layer       | Technology                                       |
| ----------- | ------------------------------------------------ |
| Frontend    | React 19, React Router 7, Tailwind CSS 3         |
| Charts      | Recharts 3                                       |
| HTTP Client | Axios                                            |
| Toasts      | react-hot-toast                                  |
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

| Username  | Password     | Role               | Access                         |
| --------- | ------------ | ------------------ | ------------------------------ |
| `admin`   | `admin123`   | Quản trị viên      | Toàn quyền hệ thống           |
| `manager` | `manager123` | Quản lý            | Đơn hàng + Khách hàng         |
| `viewer`  | `viewer123`  | Xem                | Chỉ xem                       |

## Features

### Core
- **CRUD hoàn chỉnh** cho Đơn hàng, Sản phẩm, Kho hàng, Khách hàng
- **Phân quyền RBAC** theo mô hình `resource:action` ở cấp route và component
- **Dashboard analytics** với biểu đồ doanh thu theo tháng, trạng thái đơn hàng (pie chart), top sản phẩm tồn kho
- **Dashboard filters** theo khoảng ngày, sản phẩm, trạng thái — tất cả thống kê và biểu đồ phản hồi theo bộ lọc
- **Form đơn hàng phức tạp** — tạo/chọn khách hàng, thêm sản phẩm, tính VAT, phí ship, công nợ, chuyển khoản

### Theo dõi thanh toán
- **Ghi nhận nhiều lần thanh toán** cho mỗi đơn hàng (đặt cọc + tất toán, trả góp...)
- **Thanh toán bar** hiển thị tiến độ thu tiền (progress bar màu + phần trăm)
- **Badge trạng thái** trên danh sách đơn: Đã TT / Một phần / Chưa TT
- **Lọc theo trạng thái thanh toán** trực tiếp trên trang Orders
- **Chip "Đã thu"** trong thanh tổng hợp Dashboard (tính từ tổng payment_history)
- **Xóa liên kết** — khi xóa đơn hàng, toàn bộ payment_history của đơn đó tự động bị xóa

### Enterprise
- **Toast notifications** — react-hot-toast (dark theme, bottom-center)
- **In hóa đơn** — popup HTML/CSS với bảng chi tiết, trạng thái, tổng cộng
- **Skeleton loading** — hiệu ứng pulse khi tải dữ liệu
- **Đồng bộ tồn kho** — tự động hoàn kho khi hủy đơn hàng
- **Cảnh báo tồn kho thấp** — đỏ (<5), vàng (<100) trên thanh tổng quan
- **Tìm kiếm & lọc đa tiêu chí** — theo tên, SKU, danh mục, vị trí, ngày, trạng thái

### Việt hóa
- Toàn bộ labels, placeholders, buttons, validation, toast messages
- Trạng thái: Mới, Đang xử lý, Hoàn thành, Đã hủy
- Thanh toán: Tiền mặt, Chuyển khoản, Công nợ, Thanh toán khi nhận hàng
- Định dạng tiền: VNĐ (vi-VN locale), ngày: DD/MM/YYYY
- Dữ liệu mẫu: cửa hàng tạp hóa Việt Nam (gạo, mì, bia, nước mắm, dầu gội...)

## Architecture

Codebase tuân theo **Clean Architecture** với phân tách rõ ràng giữa các layer.

```
src/
├── constants/          # Hằng số dùng chung (single source of truth)
│   └── index.js        # PAGE_SIZE, VAT_RATE, STATUS_CONFIG, PAYMENT_METHODS, SHIPPING_UNITS
│
├── utils/              # Pure functions (không side effects)
│   ├── format.js       # fmt, fmtCurrency, fmtDate, fmtDateTime (vi-VN)
│   ├── generate.js     # generateOrderId (ORD-YYYYMMDD-###)
│   ├── rbacHelper.js   # hasPermission, canAccess, hasMinimumLevel, isAdmin
│   └── printInvoice.js # In hóa đơn popup với HTML/CSS
│
├── services/           # Data access layer (API abstraction)
│   ├── api.js          # Axios instance (baseURL: localhost:8080)
│   ├── authService.js  # login, logout, getCurrentUser, isAuthenticated
│   ├── orderService.js # CRUD + order details + getAllOrderDetails
│   ├── paymentService.js   # getAll, getByOrderId, create, deleteByOrderId
│   ├── productService.js
│   ├── customerService.js
│   └── inventoryService.js  # deductStock, restoreStock, updateStock
│
├── contexts/           # React context (global state)
│   └── AuthContext.jsx # AuthProvider, useAuth, useAuthorization hooks
│
├── hooks/              # Reusable custom hooks
│   ├── useCrudPage.js  # Generic CRUD page state machine
│   ├── usePermissions.js   # canCreate/canRead/canEdit/canDelete
│   ├── useOrderStats.js    # Revenue, totals, low stock alerts, totalReceived
│   └── useInventorySync.js # Hoàn kho khi hủy đơn
│
├── components/         # Shared UI components
│   ├── Layout.jsx          # App shell: sidebar + header + profile modal
│   ├── DataTable.jsx       # Generic table with column config
│   ├── Pagination.jsx      # Page nav with smart ellipsis
│   ├── Modal.jsx           # Base modal + ConfirmModal (loadingText prop)
│   ├── CrudFormModal.jsx   # Form modal + FormField + FormInput
│   ├── SearchFilter.jsx    # Search input + filter selects + date pickers
│   ├── Allow.jsx           # Permission-gated rendering
│   ├── ProtectedRoute.jsx  # Route guard (auth + permission)
│   ├── OrderForm.jsx       # Form tạo/sửa đơn hàng
│   ├── OrderList.jsx       # Bảng đơn hàng + status actions + payment badge
│   ├── OrderSummaryBar.jsx # Stat chips (4 chips, bao gồm Đã thu) + low stock alerts
│   ├── CancelReasonModal.jsx # Nhập lý do hủy + hoàn kho
│   ├── PaymentHistory.jsx  # Timeline lịch sử thanh toán + progress bar
│   └── AddPaymentModal.jsx # Form nhập lần thanh toán mới
│
├── pages/              # Route pages (composition layer)
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx       # Thống kê + biểu đồ + bộ lọc
│   ├── OrdersPage.jsx          # Danh sách đơn hàng
│   ├── OrderCreatePage.jsx     # Tạo đơn hàng mới
│   ├── OrderUpdatePage.jsx     # Sửa đơn hàng
│   ├── OrderDetailPage.jsx     # Chi tiết đơn hàng + in hóa đơn
│   ├── ProductsPage.jsx        # CRUD sản phẩm (useCrudPage)
│   ├── CustomersPage.jsx       # CRUD khách hàng
│   └── InventoryPage.jsx       # Quản lý tồn kho
│
└── App.jsx             # Root: routing + lazy loading + permission gates
```

## Data Model

```
users           — id, username, password, name, role, permissions[], hierarchyLevel
orders          — id (ORD-YYYYMMDD-###), customer_id, status, payment_method,
                  delivery_date, shipping_unit, shipping_fee, has_vat, total_amount,
                  prepaid_amount, bank_info, cancel_reason, note, created_at
order_details   — id, order_id, product_id, quantity, unit_price
payment_history — id, order_id, amount_paid, date, note
products        — id, sku, name, base_price, category, unit
customers       — id, full_name, phone, address, created_at
inventory       — id, product_id, stock_quantity, location, last_updated
```

## Routes

| Path                  | Page              | Permission        | Mô tả                     |
| --------------------- | ----------------- | ----------------- | -------------------------- |
| `/login`              | LoginPage         | —                 | Đăng nhập                  |
| `/`                   | DashboardPage     | `dashboard:read`  | Thống kê + biểu đồ + lọc  |
| `/orders`             | OrdersPage        | `orders:list`     | Danh sách đơn hàng         |
| `/orders/create`      | OrderCreatePage   | `orders:create`   | Tạo đơn hàng mới           |
| `/orders/update?id=`  | OrderUpdatePage   | `orders:update`   | Sửa đơn hàng               |
| `/orders/detail?id=`  | OrderDetailPage   | `orders:read`     | Chi tiết + in hóa đơn      |
| `/products`           | ProductsPage      | `products:list`   | Quản lý sản phẩm           |
| `/customers`          | CustomersPage     | `customers:list`  | Quản lý khách hàng         |
| `/inventory`          | InventoryPage     | `inventory:list`  | Quản lý tồn kho            |

## RBAC System

Permissions theo mô hình `resource:action`:
- **Resources**: `orders`, `products`, `inventory`, `customers`, `users`, `dashboard`
- **Actions**: `create`, `read`, `update`, `delete`, `list`

Sử dụng `<Allow permission="orders:create">` cho conditional rendering và `<ProtectedRoute>` cho route guard. Hook `usePermissions(resource)` cung cấp `canCreate`, `canRead`, `canEdit`, `canDelete`.

## Design Principles

### Single Responsibility (SRP)
- **Constants**: một module cho tất cả hằng số (`PAGE_SIZE`, `STATUS_CONFIG`, etc.)
- **Format utilities**: một module cho formatting (`fmt`, `fmtCurrency`, `fmtDate`)
- **Services**: mỗi service quản lý một API resource
- **Components**: mỗi component đảm nhiệm một presentation concern

### Open/Closed (OCP)
- `useCrudPage` hook mở rộng qua config callbacks mà không sửa hook
- `DataTable` render mọi data shape qua column config
- `SearchFilter` hỗ trợ filter tùy ý qua `filters` array (select, date)

### Dependency Inversion (DIP)
- Pages phụ thuộc vào service abstractions, không gọi trực tiếp API
- `useCrudPage` nhận service functions qua config

### DRY
- `fmt()` tập trung trong `utils/format.js` (thay vì duplicate 5+ files)
- CRUD state pattern trích xuất vào `useCrudPage` hook
- Filter bar UI trích xuất vào `SearchFilter` component

## Scripts

```bash
npm run server   # Start JSON Server on port 8080
npm start        # Start React dev server on port 3000
npm run build    # Production build
npm test         # Run tests
```
