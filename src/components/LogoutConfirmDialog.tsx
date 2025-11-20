import { LogOut } from 'lucide-react';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  const handleYes = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Fresh Dialog Box - Positioned below logout button on right side */}
      <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 w-80">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <LogOut className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Log Out?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to log out?
              </p>
            </div>
          </div>

          {/* Yes and No buttons - Clearly visible */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-500 transition-colors font-semibold"
            >
              No
            </button>
            <button
              onClick={handleYes}
              className="flex-1 px-4 py-2.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold shadow-md"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

