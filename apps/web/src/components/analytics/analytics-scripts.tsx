'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface AnalyticsSettings {
  'analytics.ga4.enabled'?: string;
  'analytics.ga4.measurementId'?: string;
  'analytics.ga4.debugMode'?: string;
  'analytics.gtm.enabled'?: string;
  'analytics.gtm.containerId'?: string;
  'analytics.pixel.enabled'?: string;
  'analytics.pixel.pixelId'?: string;
  'analytics.gsc.verificationTag'?: string;
}

export function AnalyticsScripts() {
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);

  useEffect(() => {
    api.get('/settings/analytics')
      .then(r => setSettings(r.data.data as AnalyticsSettings))
      .catch(() => {}); // fail silently — don't break the app
  }, []);

  if (!settings) return null;

  const ga4Enabled = settings['analytics.ga4.enabled'] === 'true';
  const ga4Id = settings['analytics.ga4.measurementId'];
  const ga4Debug = settings['analytics.ga4.debugMode'] === 'true';
  const gtmEnabled = settings['analytics.gtm.enabled'] === 'true';
  const gtmId = settings['analytics.gtm.containerId'];
  const pixelEnabled = settings['analytics.pixel.enabled'] === 'true';
  const pixelId = settings['analytics.pixel.pixelId'];

  return (
    <>
      {/* Google Tag Manager */}
      {gtmEnabled && gtmId && (
        <>
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          {/* GTM noscript goes in body — handled separately */}
        </>
      )}

      {/* Google Analytics 4 (only if GTM is NOT active — avoid double-counting) */}
      {ga4Enabled && ga4Id && !gtmEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}'${ga4Debug ? ",{'debug_mode':true}" : ''});`}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {pixelEnabled && pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
