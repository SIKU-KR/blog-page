/**
 * Root loading skeleton
 * Shows while the main page is loading
 */
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl mx-auto px-4">
          {/* Profile Image Skeleton */}
          <div className="w-56 h-56 bg-gray-200 rounded-full flex-shrink-0" />

          {/* Text Content Skeleton */}
          <div className="flex flex-col space-y-6 text-center md:text-left flex-1">
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto md:mx-0" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-full" />
                <div className="h-6 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="h-10 w-24 bg-gray-200 rounded-md" />
              <div className="h-10 w-24 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog Section Skeleton */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6" />

        {/* Post Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
