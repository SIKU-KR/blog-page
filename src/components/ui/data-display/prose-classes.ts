const defaultClassName = 'prose max-w-none bg-white';

const customStyles = `
  prose-headings:my-6 prose-headings:leading-relaxed prose-headings:tracking-tight prose-headings:text-gray-900
  prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-2 prose-h1:mt-2 prose-h1:leading-tight prose-h1:tracking-tight
  prose-h2:text-xl prose-h2:font-bold prose-h2:mb-2 prose-h2:mt-4 prose-h2:leading-relaxed prose-h2:tracking-tight
  prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4 prose-h3:leading-relaxed prose-h3:tracking-tight
  prose-h4:text-base prose-h4:font-medium prose-h4:mb-2 prose-h4:mt-4 prose-h4:leading-relaxed prose-h4:tracking-tight
  prose-p:text-base prose-p:my-2 prose-p:leading-7 prose-p:tracking-tight prose-p:text-black-800
  prose-ul:my-2 prose-ul:leading-7 prose-ol:my-2 prose-ol:leading-7
  prose-li:my-2 prose-li:text-base prose-li:leading-7 prose-li:tracking-tight prose-li:text-gray-800 prose-li:pl-1
  prose-blockquote:my-4 prose-blockquote:border-l-0 prose-blockquote:not-italic prose-blockquote:text-gray-600 prose-blockquote:leading-relaxed prose-blockquote:font-normal
  prose-strong:text-gray-900 prose-strong:font-medium
  prose-em:text-gray-700
  prose-a:text-blue-600 prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:text-blue-800
  prose-pre:text-sm prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:border-0 prose-pre:shadow-none prose-pre:rounded-none prose-pre:my-4
  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:text-gray-800 prose-code:font-medium
  prose-img:my-6 prose-img:rounded-lg prose-img:shadow-sm prose-img:max-w-full prose-img:max-h-80 prose-img:object-contain prose-img:block
  prose-table:my-6 prose-table:border-collapse
  prose-th:bg-gray-50 prose-th:py-3 prose-th:px-4 prose-th:text-left prose-th:font-semibold prose-th:text-gray-900 prose-th:border prose-th:border-gray-300
  prose-td:py-3 prose-td:px-4 prose-td:border prose-td:border-gray-300 prose-td:text-gray-800
  prose-hr:my-6 prose-hr:border-gray-200 prose-hr:opacity-80 prose-hr:w-1/2 prose-hr:mx-auto
`;

export const proseClasses = `${defaultClassName} ${customStyles}`;
