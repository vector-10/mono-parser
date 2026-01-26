import { MessageSquare } from "lucide-react";

export default function OperationsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] text-center">
      <div className="bg-gray-100 rounded-full p-6 mb-4">
        <MessageSquare className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No application selected</h3>
      <p className="text-gray-500 max-w-sm">
        Create a new application or select an existing one from the sidebar to view analysis
      </p>
    </div>
  );
}