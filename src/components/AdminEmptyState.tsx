/** État vide d'une section pas encore branchée. */
export default function AdminEmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-8 text-center">
      <p className="mx-auto max-w-md leading-[1.7] text-parchment-dim">
        {children}
      </p>
    </div>
  );
}
