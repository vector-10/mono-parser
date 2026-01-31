import { MoreVertical } from "lucide-react";
import { useState } from "react";
import  UpdateApplicantModal  from "./UpdateAplicantModal";
import  DeleteApplicantModal  from "./DeleteApplicantModal";

function ApplicantMenu({ applicant }: { applicant: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="absolute right-2 top-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowUpdateModal(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
            >
              Update Applicant
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteModal(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
            >
              Delete Applicant
            </button>
          </div>
        )}
      </div>

      <UpdateApplicantModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        applicant={applicant}
      />

      <DeleteApplicantModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        applicant={applicant}
      />
    </>
  );
}

export default ApplicantMenu;