
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Unit = {
  id: number;
  name: string;
  short_name: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  unit: Unit;
  min_stock: number;
  stock: number;
  is_low: boolean;
  image_url: string | null;
  is_active: boolean;
};

type MaterialRequest = {
  id: number;
  staff: { id: number; name: string };
  product: { id: number; name: string; unit_short: string };
  requested_qty: number;
  issued_qty: number | null;
  status: string;
  reject_reason: string | null;
  admin: { id: number; name: string; role: string } | null;
  created_at: string;
  updated_at: string;
};

type LedgerRow = {
  id: number;
  product: { id: number; name: string };
  quantity: number;
  type: string;
  staff: { id: number; name: string } | null;
  admin: { id: number; name: string; role: string } | null;
  note: string | null;
  balance_after: number;
  created_at: string;
};

const units: Unit[] = [
  { id: 1, name: "Litre", short_name: "L" },
  { id: 2, name: "Kilogram", short_name: "Kg" },
];

const products: Product[] = [
  {
    id: 8,
    name: "Phenyl",
    description: "Floor cleaner",
    unit: units[0],
    min_stock: 10,
    stock: 18,
    is_low: false,
    image_url: "/api/v1/files/p8.webp",
    is_active: true,
  },
];

const ledgerRows: LedgerRow[] = [
  {
    id: 77,
    product: { id: 8, name: "Phenyl" },
    quantity: -2,
    type: "ISSUE",
    staff: { id: 5, name: "Suresh Kumar" },
    admin: { id: 1, name: "Ravi Admin", role: "admin" },
    note: "Cleaning work",
    balance_after: 16,
    created_at: "2026-12-10T11:00:00Z",
  },
];

const rejectReasons = [
  { id: 1, reason: "Out of stock" },
  { id: 2, reason: "Invalid quantity" },
];

const materialRequests: MaterialRequest[] = [
  {
    id: 60,
    staff: { id: 5, name: "Suresh Kumar" },
    product: { id: 8, name: "Phenyl", unit_short: "L" },
    requested_qty: 2,
    issued_qty: null,
    status: "PENDING",
    reject_reason: null,
    admin: null,
    created_at: "2026-12-10T09:00:00Z",
    updated_at: "2026-12-10T09:00:00Z",
  },
];

let nextUnitId = 3;
let nextProductId = 9;
let nextLedgerId = 78;
let nextReasonId = 3;
let nextRequestId = 61;

const pageResponse = <T,>(data: T[], request: Request) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("page_size") ?? 20)),
  );

  return {
    items: data.slice((page - 1) * pageSize, page * pageSize),
    total: data.length,
    page,
    page_size: pageSize,
  };
};

const updateLowStock = (product: Product) => {
  product.is_low = product.stock <= product.min_stock;
};

const addLedgerRow = (
  product: Product,
  quantity: number,
  type: string,
  note?: string,
) => {
  ledgerRows.push({
    id: nextLedgerId++,
    product: { id: product.id, name: product.name },
    quantity,
    type,
    staff: null,
    admin: { id: 1, name: "Ravi Admin", role: "admin" },
    note: note ?? null,
    balance_after: product.stock,
    created_at: new Date().toISOString(),
  });
};

export const inventoryHandlers = [
  // 96. Get units
  http.get(`${BASE}/admin/units`, () =>
    HttpResponse.json(units),
  ),

  // 97. Create unit
  http.post(`${BASE}/admin/units`, async ({ request }) => {
    const body = (await request.json()) as Omit<Unit, "id">;

    const item: Unit = { id: nextUnitId++, ...body };
    units.push(item);

    return HttpResponse.json(item, { status: 201 });
  }),

  // 98. Update unit
  http.patch(`${BASE}/admin/units/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Unit>;
    const unit = units.find((item) => item.id === Number(params.id));

    if (!unit) {
      return HttpResponse.json(
        { detail: "Unit not found" },
        { status: 404 },
      );
    }

    Object.assign(unit, body);
    return HttpResponse.json(unit);
  }),

  // 99. Delete unit
  http.delete(`${BASE}/admin/units/:id`, ({ params }) => {
    const id = Number(params.id);

    if (products.some((product) => product.unit.id === id)) {
      return HttpResponse.json(
        { detail: "Unit is in use" },
        { status: 409 },
      );
    }

    const index = units.findIndex((item) => item.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Unit not found" },
        { status: 404 },
      );
    }

    units.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 100. Get products
  http.get(`${BASE}/admin/products`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const isActive = url.searchParams.get("is_active");
    const lowStock = url.searchParams.get("low_stock");

    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(search) &&
        (isActive === null || String(item.is_active) === isActive) &&
        (lowStock !== "true" || item.is_low),
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // 101. Create product
  http.post(`${BASE}/admin/products`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      unit_id: number;
      min_stock: number;
    };

    const unit = units.find((item) => item.id === Number(body.unit_id));

    if (!unit) {
      return HttpResponse.json(
        { detail: "Unit not found" },
        { status: 404 },
      );
    }

    const product: Product = {
      id: nextProductId++,
      name: body.name,
      description: body.description ?? "",
      unit,
      min_stock: body.min_stock,
      stock: 0,
      is_low: true,
      image_url: null,
      is_active: true,
    };

    products.push(product);
    return HttpResponse.json(product, { status: 201 });
  }),

  // 102. Get product by ID
  http.get(`${BASE}/admin/products/:id`, ({ params }) => {
    const product = products.find(
      (item) => item.id === Number(params.id),
    );

    return product
      ? HttpResponse.json(product)
      : HttpResponse.json(
          { detail: "Product not found" },
          { status: 404 },
        );
  }),

  // 103. Update product
  http.patch(`${BASE}/admin/products/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const product = products.find(
      (item) => item.id === Number(params.id),
    );

    if (!product) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    if (body.unit_id !== undefined) {
      const unit = units.find(
        (item) => item.id === Number(body.unit_id),
      );

      if (!unit) {
        return HttpResponse.json(
          { detail: "Unit not found" },
          { status: 404 },
        );
      }

      product.unit = unit;
    }

    if (body.name !== undefined) product.name = String(body.name);
    if (body.description !== undefined) {
      product.description = String(body.description);
    }
    if (body.min_stock !== undefined) {
      product.min_stock = Number(body.min_stock);
    }
    if (body.is_active !== undefined) {
      product.is_active = Boolean(body.is_active);
    }

    updateLowStock(product);
    return HttpResponse.json(product);
  }),

  // 104. Delete product
  http.delete(`${BASE}/admin/products/:id`, ({ params }) => {
    const id = Number(params.id);

    if (materialRequests.some((item) => item.product.id === id)) {
      return HttpResponse.json(
        { detail: "Product is in use" },
        { status: 409 },
      );
    }

    const index = products.findIndex((item) => item.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    products.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 105. Upload product image
  http.post(`${BASE}/admin/products/:id/image`, async ({ params, request }) => {
    const product = products.find(
      (item) => item.id === Number(params.id),
    );

    if (!product) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    await request.formData();
    product.image_url = `/api/v1/files/product-${product.id}.webp`;

    return HttpResponse.json(product);
  }),

  // 106. Get inventory products
  http.get(`${BASE}/admin/inventory`, ({ request }) =>
    HttpResponse.json(pageResponse(products, request)),
  ),

  // 107. Get product transactions
  http.get(`${BASE}/admin/inventory/:product_id/transactions`, ({ params, request }) => {
    const productId = Number(params.product_id);
    const filtered = ledgerRows.filter(
      (row) => row.product.id === productId,
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // 108. Add stock
  http.post(`${BASE}/admin/inventory/add-stock`, async ({ request }) => {
    const body = (await request.json()) as {
      product_id: number;
      quantity: number;
      note?: string;
    };

    const product = products.find(
      (item) => item.id === Number(body.product_id),
    );

    if (!product) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    if (body.quantity <= 0) {
      return HttpResponse.json(
        { detail: "Quantity must be greater than zero" },
        { status: 422 },
      );
    }

    product.stock += body.quantity;
    updateLowStock(product);
    addLedgerRow(product, body.quantity, "ADD", body.note);

    return HttpResponse.json(ledgerRows[ledgerRows.length - 1], {
      status: 201,
    });
  }),

  // 109. Adjust stock
  http.post(`${BASE}/admin/inventory/adjust`, async ({ request }) => {
    const body = (await request.json()) as {
      product_id: number;
      quantity: number;
      note: string;
    };

    const product = products.find(
      (item) => item.id === Number(body.product_id),
    );

    if (!product) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    if (product.stock + body.quantity < 0) {
      return HttpResponse.json(
        { detail: "Stock cannot go below zero" },
        { status: 409 },
      );
    }

    product.stock += body.quantity;
    updateLowStock(product);
    addLedgerRow(product, body.quantity, "ADJUST", body.note);

    return HttpResponse.json(ledgerRows[ledgerRows.length - 1], {
      status: 201,
    });
  }),

  // 110. Get low-stock products
  http.get(`${BASE}/admin/inventory/low-stock`, () =>
    HttpResponse.json(products.filter((item) => item.is_low)),
  ),

  // 111. Get issued history
  http.get(`${BASE}/admin/inventory/issued-history`, ({ request }) => {
    const filtered = ledgerRows.filter(
      (row) => row.type === "ISSUE",
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // 112. Get reject reasons
  http.get(`${BASE}/admin/reject-reasons`, () =>
    HttpResponse.json(rejectReasons),
  ),

  // 113. Create reject reason
  http.post(`${BASE}/admin/reject-reasons`, async ({ request }) => {
    const body = (await request.json()) as { reason: string };
    const item = { id: nextReasonId++, reason: body.reason };

    rejectReasons.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // 114. Delete reject reason
  http.delete(`${BASE}/admin/reject-reasons/:id`, ({ params }) => {
    const index = rejectReasons.findIndex(
      (item) => item.id === Number(params.id),
    );

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Reject reason not found" },
        { status: 404 },
      );
    }

    rejectReasons.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 115. Get admin material requests
  http.get(`${BASE}/admin/material-requests`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const filtered = materialRequests.filter(
      (item) => !status || item.status === status,
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // 116. Accept material request
  http.post(`${BASE}/admin/material-requests/:id/accept`, ({ params }) => {
    const item = materialRequests.find(
      (entry) => entry.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Request not found" },
        { status: 404 },
      );
    }

    if (item.status !== "PENDING") {
      return HttpResponse.json(
        { detail: "Request is not pending" },
        { status: 409 },
      );
    }

    item.status = "ACCEPTED";
    item.updated_at = new Date().toISOString();

    return HttpResponse.json(item);
  }),

  // 117. Reject material request
  http.post(`${BASE}/admin/material-requests/:id/reject`, async ({ params, request }) => {
    const body = (await request.json()) as {
      reject_reason_id?: number;
      custom_reason?: string;
    };

    const item = materialRequests.find(
      (entry) => entry.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Request not found" },
        { status: 404 },
      );
    }

    if (item.status !== "PENDING" && item.status !== "ACCEPTED") {
      return HttpResponse.json(
        { detail: "Request cannot be rejected" },
        { status: 409 },
      );
    }

    const reason = rejectReasons.find(
      (entry) => entry.id === body.reject_reason_id,
    );

    item.status = "REJECTED";
    item.reject_reason = body.custom_reason ?? reason?.reason ?? "Out of stock";
    item.updated_at = new Date().toISOString();

    return HttpResponse.json(item);
  }),

  // 118. Issue material request
  http.post(`${BASE}/admin/material-requests/:id/issue`, async ({ params, request }) => {
    const body = (await request.json()) as { issued_qty: number };

    const item = materialRequests.find(
      (entry) => entry.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Request not found" },
        { status: 404 },
      );
    }

    if (item.status !== "ACCEPTED") {
      return HttpResponse.json(
        { detail: "Request must be accepted first" },
        { status: 409 },
      );
    }

    const product = products.find(
      (entry) => entry.id === item.product.id,
    );

    if (!product) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    if (body.issued_qty <= 0 || body.issued_qty > product.stock) {
      return HttpResponse.json(
        { detail: "Invalid issued quantity" },
        { status: 409 },
      );
    }

    product.stock -= body.issued_qty;
    updateLowStock(product);

    item.issued_qty = body.issued_qty;
    item.status = "ISSUED";
    item.admin = { id: 1, name: "Ravi Admin", role: "admin" };
    item.updated_at = new Date().toISOString();

    addLedgerRow(product, -body.issued_qty, "ISSUE");

    return HttpResponse.json(item);
  }),

  // 119. Get products for staff material requests
  http.get(`${BASE}/staff/material-requests/products`, () =>
    HttpResponse.json(
      products
        .filter((product) => product.is_active)
        .map((product) => ({
          id: product.id,
          name: product.name,
          unit_short: product.unit.short_name,
          stock: product.stock,
        })),
    ),
  ),

  // 120. Create staff material request
  http.post(`${BASE}/staff/material-requests`, async ({ request }) => {
    const body = (await request.json()) as {
      product_id: number;
      requested_qty: number;
    };

    const product = products.find(
      (item) => item.id === Number(body.product_id),
    );

    if (!product) {
      return HttpResponse.json(
        { detail: "Product not found" },
        { status: 404 },
      );
    }

    if (body.requested_qty <= 0) {
      return HttpResponse.json(
        { detail: "Quantity must be greater than zero" },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();

    const item: MaterialRequest = {
      id: nextRequestId++,
      staff: { id: 5, name: "Suresh Kumar" },
      product: {
        id: product.id,
        name: product.name,
        unit_short: product.unit.short_name,
      },
      requested_qty: body.requested_qty,
      issued_qty: null,
      status: "PENDING",
      reject_reason: null,
      admin: null,
      created_at: now,
      updated_at: now,
    };

    materialRequests.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // 121. Get staff material requests
  http.get(`${BASE}/staff/material-requests`, ({ request }) =>
    HttpResponse.json(pageResponse(materialRequests, request)),
  ),

  // 122. Cancel staff material request
  http.post(`${BASE}/staff/material-requests/:id/cancel`, ({ params }) => {
    const item = materialRequests.find(
      (entry) => entry.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Request not found" },
        { status: 404 },
      );
    }

    if (item.status !== "PENDING") {
      return HttpResponse.json(
        { detail: "Only pending requests can be cancelled" },
        { status: 409 },
      );
    }

    item.status = "CANCELLED";
    item.updated_at = new Date().toISOString();

    return HttpResponse.json(item);
  }),
];
