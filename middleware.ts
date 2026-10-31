import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieListe = { name: string; value: string; options?: CookieOptions }[];

/**
 * Rafraîchit la session Supabase à chaque requête et protège les espaces privés.
 * En mode démonstration (sans variables d'environnement), le contrôle est fait
 * directement dans les layouts serveur.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  const response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: CookieListe) => {
        list.forEach(({ name, value, options }: { name: string; value: string; options?: CookieOptions }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prive = ["/compte", "/vendeur", "/livreur", "/admin"];
  if (!user && prive.some((p) => request.nextUrl.pathname.startsWith(p))) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/connexion";
    redirect.searchParams.set("suite", request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
