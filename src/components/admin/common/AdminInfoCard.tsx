interface AdminInfoCardProps {
  title: string;
  description: string;
}

export default function AdminInfoCard({ title, description }: AdminInfoCardProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-blue-800 mb-2">{title}</h2>
      <p className="text-blue-700 text-sm">{description}</p>
    </div>
  );
}
