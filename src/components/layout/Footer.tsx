export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-gray-500 flex items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} 3S Engenharia</span>
        <span>Fluxo inicial de cadastro da proposta</span>
      </div>
    </footer>
  );
}
