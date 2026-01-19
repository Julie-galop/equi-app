export default function Header() {
  return (
    <header className="bg-white">
      <div className="px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Logo Galop (gauche) */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-4">
            <img
              src="/logo-galop.png"
              alt="Logo Le Galop Tricastin"
              width={56}
              height={56}
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
            />

            {/* Logo élevage mobile */}
            <img
              src="/logo-elevage.png"
              alt="Logo élevage"
              width={56}
              height={56}
              className="w-14 h-14 object-contain sm:hidden"
            />
          </div>

          {/* Titre */}
          <div className="text-center sm:flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d5998] tracking-tight">
              Le Galop Tricastin
            </h1>
          </div>

          {/* Logo élevage desktop */}
          <div className="hidden sm:block">
            <img
              src="/logo-elevage.png"
              alt="Logo élevage"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#1d5998]" />
    </header>
  );
}