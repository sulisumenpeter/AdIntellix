export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Projects</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          New Project
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        No projects yet. Create a project to start tracking competitors.
      </div>
    </div>
  );
}
