import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-white">
      <div className="px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Logo Galop (gauche) */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-4">
            <Image
              src="/logo-galop.png"
              alt="Logo Le Galop Tricastin"
              width={56}
              height={56}
              priority
              className="sm:w-[64px] sm:h-[64px]"
            />

            {/* Logo élevage visible sur mobile */}
            <Image
              src="/logo-elevage.png"
              alt="Logo élevage"
              width={56}
              height={56}
              priority
              className="sm:hidden"
            />
          </div>

          {/* Titre centré */}
          <div className="text-center sm:flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d5998] tracking-tight">
              Le Galop Tricastin
            </h1>
          </div>

          {/* Logo élevage desktop */}
          <div className="hidden sm:block">
            <Image
              src="/logo-elevage.png"
              alt="Logo élevage"
              width={64}
              height={64}
              priority
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#1d5998]" />
    </header>
  );
}