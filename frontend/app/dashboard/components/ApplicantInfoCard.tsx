interface ApplicantInfoCardProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bvn?: string;
  createdAt: string;
}

export default function ApplicantInfoCard({
  firstName,
  lastName,
  email,
  phone,
  bvn,
  createdAt,
}: ApplicantInfoCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {firstName} {lastName}
      </h3>
      <div className="space-y-1 text-sm">
        <p className="text-gray-600">{email}</p>
        {phone && <p className="text-gray-600">{phone}</p>}
        {bvn && <p className="text-xs text-gray-400 font-mono">BVN: {bvn}</p>}
        <p className="text-xs text-gray-500 pt-2">
          Created: {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}