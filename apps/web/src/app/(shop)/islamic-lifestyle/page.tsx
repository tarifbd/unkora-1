import type { Metadata } from 'next';
import { IslamicLifestyleClient } from './islamic-lifestyle-client';

export const metadata: Metadata = {
  title: 'Islamic Lifestyle — UNKORA',
  description: 'নামাজের সরঞ্জাম, ইসলামিক পোশাক, আতর, তাসবিহ, কুরআন অ্যাক্সেসরিজ এবং আরও অনেক কিছু। বিশ্বমানের ইসলামিক পণ্য।',
  keywords: ['Islamic lifestyle', 'নামাজ', 'তাসবিহ', 'জায়নামাজ', 'আতর', 'ইসলামিক পোশাক', 'কুরআন'],
};

export default function IslamicLifestylePage() {
  return <IslamicLifestyleClient />;
}
