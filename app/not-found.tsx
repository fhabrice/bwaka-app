import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="conteneur flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="surtitre">Erreur 404</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Cette page n’existe pas</h1>
      <p className="mt-3 max-w-md text-sm text-bwaka-950/55">
        Le produit ou la boutique que vous cherchez a peut-être été retiré. Retournez au catalogue
        pour trouver les articles disponibles près de chez vous.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/produits" className="btn-primaire">Explorer le catalogue</Link>
        <Link href="/" className="btn-contour">Retour à l’accueil</Link>
      </div>
    </div>
  );
}
