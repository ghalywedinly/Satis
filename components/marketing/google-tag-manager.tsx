import Script from "next/script";
import { publicEnv } from "@/lib/env/public";

/**
 * Google Tag Manager for the public marketing pages (home, blog, booking). It is deliberately
 * not loaded in the dashboard or on survey pages, so customers' answers and teams' data never
 * reach third-party tags. Configure page views with a "History change" trigger in GTM, because
 * the site navigates without full page loads.
 */
export function GoogleTagManager() {
  const id = publicEnv.NEXT_PUBLIC_GTM_ID;
  if (!id) return null;
  return (
    <Script
      id="gtm"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(id)});`,
      }}
    />
  );
}
