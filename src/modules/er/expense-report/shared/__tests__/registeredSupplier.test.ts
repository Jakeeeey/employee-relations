import { describe, expect, it } from "vitest";
import { resolveRegisteredSupplier } from "../registeredSupplier";

const supplierA = { id: 1, supplier_name: "Alpha Supplier" };
const supplierB = { id: 2, supplier_name: "Beta Supplier" };

describe("resolveRegisteredSupplier", () => {
  it("uses the only assigned supplier without a multiple-assignment warning", () => {
    expect(resolveRegisteredSupplier([supplierA])).toEqual({
      supplier: supplierA,
      hasMultipleAssignments: false,
    });
  });

  it("uses the first assigned supplier and flags multiple assignments", () => {
    expect(resolveRegisteredSupplier([supplierA, supplierB])).toEqual({
      supplier: supplierA,
      hasMultipleAssignments: true,
    });
  });

  it("returns no registered supplier when no assignment exists", () => {
    expect(resolveRegisteredSupplier([])).toEqual({
      supplier: null,
      hasMultipleAssignments: false,
    });
  });
});
