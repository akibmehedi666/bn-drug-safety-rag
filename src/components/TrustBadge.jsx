import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TrustBadge = ({ drug }) => {
  const { lang, t } = useApp();
  const isSafe = drug.safetyRating === 'safe';
  const isCaution = drug.safetyRating === 'caution';
  const isUnsafe = drug.safetyRating === 'unsafe';

  return (
    <div className="space-y-3">
      {/* Primary Trust Badge */}
      <div className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all ${
        isSafe 
          ? 'bg-warmAlert-safeBg border-warmAlert-safeBorder text-warmAlert-safe' 
          : isCaution
          ? 'bg-warmAlert-cautionBg border-warmAlert-cautionBorder text-warmAlert-caution'
          : 'bg-warmAlert-dangerBg border-warmAlert-dangerBorder text-warmAlert-danger'
      }`}>
        <div className="mt-0.5 shrink-0">
          {isSafe ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm sm:text-base tracking-tight">
              {lang === 'bn' ? drug.trustBadgeTextBn : drug.trustBadgeTextEn}
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 shadow-xs border border-current">
              <ShieldCheck className="w-3 h-3 mr-1 inline" />
              {drug.trustLevel === 'verified' ? (lang === 'bn' ? 'যাচাইকৃত' : 'Verified') : (lang === 'bn' ? 'সতর্কতা' : 'Caution')}
            </span>
          </div>

          <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed font-normal">
            {drug.trustLevel === 'verified' ? t.verifiedDesc : t.limitedDesc}
          </p>
        </div>
      </div>

      {/* Citation Line */}
      <div className="flex items-center justify-between px-3 py-2 bg-cream-base/80 rounded-xl border border-amber-900/10 text-xs text-gray-600">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-maternal-700">{t.sourceCitation}:</span>
          <span className="font-medium text-gray-700">
            {lang === 'bn' ? drug.sourceBn : drug.sourceEn}
          </span>
        </div>
        <a 
          href="https://medex.com.bd" 
          target="_blank" 
          rel="noreferrer"
          className="text-maternal-600 hover:text-maternal-800 flex items-center font-medium space-x-0.5 hover:underline"
        >
          <span>MedEx BD</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default TrustBadge;
