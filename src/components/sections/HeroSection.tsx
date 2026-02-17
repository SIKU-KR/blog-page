import React from 'react';
import ProfileImage from '../ui/ProfileImage';
import Link from 'next/link';
import Button from '../ui/Button';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  profileAlt?: string;
  className?: string;
}

export default function HeroSection({
  title,
  subtitle,
  imageSrc,
  profileAlt = 'Profile Image',
  className = '',
}: HeroSectionProps) {
  const normalizedSubtitle = subtitle.replace(/\\n/g, '\n');

  return (
    <section className={`py-8 md:py-12 ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <ProfileImage src={imageSrc} alt={profileAlt} size="xxl" priority />

        {/* 자기소개 */}
        <div className="flex flex-col space-y-6 text-center md:text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{title}</h1>
            <p className="text-lg md:text-xl text-gray-600 whitespace-pre-line leading-relaxed">
              {normalizedSubtitle}
            </p>

            <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
              <Link
                href="https://drive.google.com/file/d/1j3u_5x1ZJXm8jRq34Pf9RhuZpyop8KoG/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="md">
                  Resume
                </Button>
              </Link>
              <Link href="mailto:peter012677@naver.com">
                <Button variant="secondary" size="md">
                  E-mail
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
