interface SupplierAssignment {
  id: number;
  supplier_name: string;
}

export function resolveRegisteredSupplier<T extends SupplierAssignment>(
  suppliers: readonly T[]
): { supplier: T | null; hasMultipleAssignments: boolean } {
  return {
    supplier: suppliers[0] ?? null,
    hasMultipleAssignments: suppliers.length > 1,
  };
}
