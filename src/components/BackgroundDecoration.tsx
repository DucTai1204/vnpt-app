import React from 'react';
import { Heart, ShieldCheck, Activity, Stethoscope } from 'lucide-react';

export const BackgroundDecoration: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Light blue soft background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-white via-sky-50/70 to-blue-100/40" />

      {/* SVG Wave lines pattern */}
      <svg
        className="absolute top-0 left-0 w-full h-full opacity-20 text-sky-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          fillOpacity="0.3"
          d="M0,192L48,202.7C96,213,192,235,288,224C384,213,480,171,576,165.3C672,160,768,192,864,213.3C960,235,1056,245,1152,229.3C1248,213,1344,171,1392,149.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        ></path>
        <path
          fill="currentColor"
          fillOpacity="0.2"
          d="M0,400L60,421.3C120,442,240,483,360,469.3C480,456,600,388,720,384C840,380,960,442,1080,453.3C1200,464,1320,427,1380,408L1440,390L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
        ></path>
      </svg>

      {/* Subtle floating medical icons */}
      <div className="absolute top-12 left-10 text-sky-200/50 animate-pulse">
        <Heart className="w-24 h-24 stroke-[1.2]" />
      </div>
      <div className="absolute top-1/3 right-8 text-sky-200/40">
        <ShieldCheck className="w-32 h-32 stroke-[1]" />
      </div>
      <div className="absolute bottom-20 left-16 text-blue-200/40">
        <Activity className="w-28 h-28 stroke-[1]" />
      </div>
      <div className="absolute bottom-10 right-20 text-sky-200/50">
        <Stethoscope className="w-20 h-20 stroke-[1.2]" />
      </div>
    </div>
  );
};
