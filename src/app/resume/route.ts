import { NextResponse } from 'next/server';

const resumeHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이력서 - 김개발</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    <style>
        /* 폰트 설정 */
        body {
            font-family: 'Noto Sans KR', sans-serif;
            color: #1f2937;
            background-color: #f3f4f6;
            line-height: 1.6;
        }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        /* A4 용지 규격 (화면용) */
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            margin: 20mm auto;
            background: white;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
        }

        /* 인쇄 설정 (핵심) */
        @page {
            size: A4;
            margin: 0;
        }

        @media print {
            html, body {
                background: white;
                margin: 0;
                padding: 0;
            }
            .page {
                margin: 0;
                padding: 15mm 20mm;
                border: initial;
                border-radius: initial;
                width: 210mm;
                min-height: 297mm;
                box-shadow: none;
                background: white;
            }
            .no-print { display: none !important; }

            /* 링크 URL 숨김 */
            a[href]:after { content: none !important; }

            /* 색상 강제 출력 */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* 페이지 나눔 방지: 섹션이나 아이템이 페이지 중간에 걸치지 않도록 함 */
        .break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* 사진 영역 스타일 */
        .profile-photo {
            width: 120px;
            height: 150px; /* 일반적인 증명사진 비율 (3:4 근접) */
            object-fit: cover;
            border: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>

    <!-- 다운로드 버튼 -->
    <div class="no-print fixed bottom-8 right-8 z-50">
        <button onclick="downloadPDF()" id="download-btn" class="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition-all font-mono flex items-center gap-2">
            <i class="fas fa-download"></i> PDF 다운로드
        </button>
    </div>

    <!-- 이력서 컨테이너 -->
    <div class="page" id="resume-container">
        <!-- 내용은 아래 자바스크립트에 의해 렌더링됩니다 -->
    </div>

    <!-- 데이터 및 렌더링 스크립트 -->
    <script>
        /*******************************************************
         * [사용자 설정 영역]
         * 아래 resumeData 객체의 내용만 수정하면 이력서에 반영됩니다.
         *******************************************************/
        const resumeData = {
            // 1. 기본 정보 & 연락처
            info: {
                nameKo: "김개발",
                nameEn: "Kim Dev",
                title: "Frontend Engineer & UI Designer",
                email: "dev.kim@example.com",
                phone: "010-1234-5678",
                github: "github.com/kimdev",
                blog: "kimdev.log",
                // 증명사진 경로 (이미지가 없다면 빈 문자열 "" 로 두면 기본 아이콘 표시)
                // 예: "./profile.jpg" 또는 "https://placehold.co/120x150"
                photoUrl: "https://placehold.co/240x300/e2e8f0/64748b?text=Photo"
            },

            // 2. 자기소개 (About)
            about: \`사용자 경험을 최우선으로 생각하는 3년차 프론트엔드 개발자입니다.
                    깔끔한 코드와 확장 가능한 아키텍처 설계에 관심이 많으며,
                    팀원들과의 원활한 커뮤니케이션을 통해 문제를 해결하는 것을 즐깁니다.\`,

            // 3. 기술 스택 (Skills) - 카테고리별 배열
            skills: [
                { category: "Languages", items: ["JavaScript(ES6+)", "TypeScript", "HTML5", "CSS3", "Python"] },
                { category: "Frameworks", items: ["React", "Next.js", "TailwindCSS", "Styled-Components"] },
                { category: "Tools & DevOps", items: ["Git", "Figma", "Vercel", "AWS (S3, CloudFront)"] }
            ],

            // 4. 경력 (Experience)
            experience: [
                {
                    company: "테크 스타트업 A",
                    position: "Frontend Developer",
                    period: "2022.04 - 현재",
                    description: [
                        "SaaS 대시보드 성능 최적화 (LCP 2.4s → 1.2s 단축)",
                        "디자인 시스템 구축 및 Storybook 도입으로 개발 생산성 30% 향상",
                        "React Query 도입을 통한 서버 상태 관리 로직 개선"
                    ]
                },
                {
                    company: "웹 에이전시 B",
                    position: "Junior Web Publisher",
                    period: "2021.06 - 2022.03",
                    description: [
                        "10개 이상의 기업 반응형 웹사이트 제작 및 유지보수",
                        "웹 접근성(WA) 인증 마크 획득 프로젝트 참여",
                        "Cross-browsing 이슈 해결 (IE11 지원 포함)"
                    ]
                }
            ],

            // 5. 프로젝트 (Projects)
            projects: [
                {
                    title: "개인 기술 블로그 개발",
                    tech: "Next.js 13, Tailwind CSS, Notion API",
                    link: "github.com/kimdev/blog",
                    description: "Notion을 CMS로 활용하여 글을 작성하면 자동으로 배포되는 정적 블로그. SEO 최적화를 위해 sitemap 자동 생성 스크립트 작성."
                },
                {
                    title: "실시간 협업 Todo 리스트",
                    tech: "React, Firebase, WebSocket",
                    link: "github.com/kimdev/todo",
                    description: "여러 사용자가 동시에 접속하여 할 일을 관리할 수 있는 웹 애플리케이션. Optimistic UI 업데이트 적용."
                }
            ],

            // 6. 학력 (Education)
            education: [
                {
                    school: "한국대학교",
                    major: "컴퓨터공학과 학사",
                    period: "2016.03 - 2022.02"
                }
            ],

            // 7. 언어 능력 (Languages)
            languages: [
                { name: "Korean", level: "Native" },
                { name: "English", level: "Fluent (OPIC AL)" }
            ]
        };

        /*******************************************************
         * [렌더링 로직]
         * 수정하지 않아도 됩니다. (디자인 변경 시에만 수정)
         *******************************************************/
        function renderResume() {
            const container = document.getElementById('resume-container');

            // 사진 HTML 생성
            const photoHtml = resumeData.info.photoUrl
                ? \`<img src="\${resumeData.info.photoUrl}" alt="Profile" class="profile-photo bg-gray-200 rounded object-cover shadow-sm">\`
                : \`<div class="profile-photo bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs border border-gray-200">No Image</div>\`;

            // Skills HTML 생성
            const skillsHtml = resumeData.skills.map(skill => \`
                <div class="mb-3 break-avoid">
                    <span class="font-bold text-sm w-32 inline-block text-gray-800">\${skill.category}</span>
                    <span class="text-sm text-gray-600 font-mono">\${skill.items.join(', ')}</span>
                </div>
            \`).join('');

            // Experience HTML 생성
            const experienceHtml = resumeData.experience.map(exp => \`
                <div class="mb-8 break-avoid">
                    <div class="flex justify-between items-baseline mb-1">
                        <h3 class="text-lg font-bold text-gray-900">\${exp.company}</h3>
                        <span class="text-sm text-gray-500 font-mono">\${exp.period}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2 font-medium">\${exp.position}</p>
                    <ul class="list-disc list-outside ml-4 text-sm text-gray-700 space-y-1 marker:text-gray-400">
                        \${exp.description.map(desc => \`<li>\${desc}</li>\`).join('')}
                    </ul>
                </div>
            \`).join('');

            // Projects HTML 생성
            const projectsHtml = resumeData.projects.map(prj => \`
                <div class="mb-6 break-avoid">
                    <div class="flex justify-between items-baseline mb-1">
                        <h3 class="text-lg font-bold text-gray-900">\${prj.title}</h3>
                        \${prj.link ? \`<span class="text-xs text-gray-400 font-mono"><i class="fab fa-github mr-1"></i>\${prj.link}</span>\` : ''}
                    </div>
                    <p class="text-xs text-teal-600 font-mono mb-2 font-medium">\${prj.tech}</p>
                    <p class="text-sm text-gray-700">\${prj.description}</p>
                </div>
            \`).join('');

             // Education HTML 생성
             const educationHtml = resumeData.education.map(edu => \`
                <div class="mb-2 break-avoid flex justify-between">
                    <div>
                        <span class="font-bold text-gray-900 mr-2">\${edu.school}</span>
                        <span class="text-sm text-gray-600">\${edu.major}</span>
                    </div>
                    <span class="text-sm text-gray-500 font-mono">\${edu.period}</span>
                </div>
            \`).join('');

            // Languages HTML 생성
            const languagesHtml = resumeData.languages.map(lang => \`
                <span class="mr-6 text-sm"><span class="font-bold text-gray-800">\${lang.name}</span> <span class="text-gray-500 font-mono text-xs">(\${lang.level})</span></span>
            \`).join('');

            // 전체 HTML 조립 (1컬럼 레이아웃)
            container.innerHTML = \`
                <!-- Header: Photo & Info -->
                <header class="flex gap-8 border-b-2 border-gray-900 pb-8 mb-8 items-start">
                    <!-- Photo -->
                    <div class="flex-shrink-0">
                        \${photoHtml}
                    </div>

                    <!-- Info -->
                    <div class="flex-grow pt-2">
                        <h1 class="text-4xl font-bold tracking-tight mb-2 text-gray-900">
                            \${resumeData.info.nameKo} <span class="text-xl text-gray-500 font-normal ml-2">\${resumeData.info.nameEn}</span>
                        </h1>
                        <p class="text-lg text-gray-700 font-mono mb-4">\${resumeData.info.title}</p>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm text-gray-600 font-mono">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-envelope w-4 text-center"></i> \${resumeData.info.email}
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-phone w-4 text-center"></i> \${resumeData.info.phone}
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fab fa-github w-4 text-center"></i> \${resumeData.info.github}
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-link w-4 text-center"></i> \${resumeData.info.blog}
                            </div>
                        </div>
                    </div>
                </header>

                <!-- About Section -->
                <section class="mb-10 break-avoid">
                    <h2 class="text-base font-bold uppercase tracking-widest text-gray-400 mb-4 font-mono border-b border-gray-200 pb-1">About</h2>
                    <p class="text-gray-800 leading-relaxed text-sm">
                        \${resumeData.about.replace(/\\n/g, '<br/>')}
                    </p>
                </section>

                <!-- Skills Section -->
                <section class="mb-10 break-avoid">
                    <h2 class="text-base font-bold uppercase tracking-widest text-gray-400 mb-4 font-mono border-b border-gray-200 pb-1">Skills</h2>
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        \${skillsHtml}
                    </div>
                </section>

                <!-- Experience Section -->
                <section class="mb-10">
                    <h2 class="text-base font-bold uppercase tracking-widest text-gray-400 mb-6 font-mono border-b border-gray-200 pb-1">Experience</h2>
                    \${experienceHtml}
                </section>

                <!-- Projects Section -->
                <section class="mb-10">
                    <h2 class="text-base font-bold uppercase tracking-widest text-gray-400 mb-6 font-mono border-b border-gray-200 pb-1">Projects</h2>
                    \${projectsHtml}
                </section>

                <!-- Education & Languages Section (Grid로 묶음) -->
                <section class="break-avoid">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 class="text-base font-bold uppercase tracking-widest text-gray-400 mb-4 font-mono border-b border-gray-200 pb-1">Education</h2>
                            \${educationHtml}
                        </div>
                        <div>
                            <h2 class="text-base font-bold uppercase tracking-widest text-gray-400 mb-4 font-mono border-b border-gray-200 pb-1">Languages</h2>
                            <div>\${languagesHtml}</div>
                        </div>
                    </div>
                </section>

                <!-- Footer -->
                <footer class="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 font-mono">
                    <p>Last updated: \${new Date().toISOString().slice(0, 10).replace(/-/g, '. ')}</p>
                </footer>
            \`;
        }

        // 초기 렌더링 실행
        renderResume();

        // PDF 다운로드 함수
        function downloadPDF() {
            const element = document.getElementById('resume-container');
            const btn = document.getElementById('download-btn');

            // 버튼 상태 변경
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 생성 중...';
            btn.disabled = true;

            const opt = {
                margin: 0,
                filename: '이력서_' + resumeData.info.nameKo + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                // 버튼 상태 복원
                btn.innerHTML = '<i class="fas fa-download"></i> PDF 다운로드';
                btn.disabled = false;
            });
        }
    </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(resumeHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
