import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: number;
  priority?: boolean;
  href?: string | null;
}

export function Logo({
  className = '',
  size = 'md',
  height,
  priority = true,
  href = '/',
}: LogoProps) {
  const heightMap = {
    sm: 34,
    md: 46,
    lg: 58,
    xl: 76,
  };

  const selectedHeight = height || heightMap[size] || 46;
  const calculatedWidth = Math.round(selectedHeight * (1024 / 365));

  const imageElement = (
    <div className={`inline-flex items-center select-none ${className}`}>
      <Image
        src="/logo.png"
        alt="MY-PROPERTY.IN — We Serve Your Dream in Reality"
        width={calculatedWidth}
        height={selectedHeight}
        priority={priority}
        unoptimized
        className="object-contain h-auto max-w-full transition-transform duration-200 hover:opacity-95"
        style={{
          height: `${selectedHeight}px`,
          width: 'auto',
          aspectRatio: '1024 / 365',
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-casa-brand rounded-lg">
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
