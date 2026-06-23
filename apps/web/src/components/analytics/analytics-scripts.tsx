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
  'analytics.clarity.enabled'?: string;
  'analytics.clarity.projectId'?: string;
  'analytics.tiktok.enabled'?: string;
  'analytics.tiktok.pixelId'?: string;
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
  const clarityEnabled = settings['analytics.clarity.enabled'] === 'true';
  const clarityProjectId = settings['analytics.clarity.projectId'];
  const tiktokEnabled = settings['analytics.tiktok.enabled'] === 'true';
  const tiktokPixelId = settings['analytics.tiktok.pixelId'];

  return (
    <>
      {/* Google Tag Manager */}
      {gtmEnabled && gtmId && (
        <>
          <Script id="gtm-head" strategy="lazyOnload">
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
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}'${ga4Debug ? ",{'debug_mode':true}" : ''});`}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {pixelEnabled && pixelId && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* Microsoft Clarity */}
      {clarityEnabled && clarityProjectId && (
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityProjectId}");`}
        </Script>
      )}

      {/* TikTok Pixel */}
      {tiktokEnabled && tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="lazyOnload">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load("${tiktokPixelId}");ttq.page();}(window,document,"ttq");`}
        </Script>
      )}
    </>
  );
}
