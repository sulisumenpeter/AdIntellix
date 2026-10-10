export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Organizations</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Create Organization
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        No organizations found. You need to create or join one.
      </div>
    </div>
  );
}
