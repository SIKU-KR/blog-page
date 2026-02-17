import { NextResponse } from 'next/server';

const RESUME_URL =
  'https://drive.google.com/file/d/1j3u_5x1ZJXm8jRq34Pf9RhuZpyop8KoG/view?usp=sharing';

export async function GET() {
  return NextResponse.redirect(RESUME_URL, 308);
}
