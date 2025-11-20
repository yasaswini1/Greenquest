import { useState } from 'react';
import { FileText, CheckCircle2, X } from 'lucide-react';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsAndConditions({ onAccept, onDecline }: TermsAndConditionsProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Terms & Conditions</h2>
              <p className="text-sm text-gray-500">Please read and accept to continue</p>
            </div>
          </div>
          <button
            onClick={onDecline}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700"
          onScroll={() => setHasScrolled(true)}
        >
          <div className="space-y-4">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Data Privacy & Image Storage</h3>
              <p className="text-sm leading-relaxed">
                <strong className="text-gray-900">Regular Activity Submissions:</strong> When you submit evidence images for activity verification, 
                our AI system analyzes these images to assess your eco-friendly activities and assign points. 
                <strong className="text-emerald-700"> These images are automatically deleted immediately after AI assessment is complete.</strong> 
                We do not store, retain, or use these images for any other purpose beyond the initial verification process.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Escalation & Ticket System</h3>
              <p className="text-sm leading-relaxed">
                If you believe the AI has incorrectly reviewed your evidence, you may raise a ticket to our admin team. 
                When you escalate a case, <strong className="text-emerald-700">the evidence images you attach to your ticket will be stored</strong> 
                for administrative review purposes. These images will only be retained until your ticket is resolved and a decision is made. 
                After resolution, escalated images may be retained for a limited period as required by applicable regulations.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Regulatory Compliance</h3>
              <p className="text-sm leading-relaxed">
                Our data handling practices comply with applicable data protection regulations, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4 mt-2">
                <li>General Data Protection Regulation (GDPR) for users in the European Union</li>
                <li>California Consumer Privacy Act (CCPA) for users in California, USA</li>
                <li>Personal Information Protection and Electronic Documents Act (PIPEDA) for users in Canada</li>
                <li>Other applicable local data protection laws based on your jurisdiction</li>
              </ul>
              <p className="text-sm leading-relaxed mt-2">
                You have the right to request access to, correction of, or deletion of your personal data, 
                including any stored escalation images, subject to legal and regulatory requirements.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Account Usage</h3>
              <p className="text-sm leading-relaxed">
                By creating an account, you agree to use this platform responsibly and only submit authentic evidence 
                of your eco-friendly activities. False submissions may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">5. AI Assessment</h3>
              <p className="text-sm leading-relaxed">
                Our AI system is designed to assess evidence fairly, but it may not always be 100% accurate. 
                If you disagree with an AI assessment, you have the right to escalate the case for human review 
                through our ticket system.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Acceptance</h3>
              <p className="text-sm leading-relaxed">
                By clicking "I Accept", you acknowledge that you have read, understood, and agree to be bound by 
                these Terms & Conditions, including our data privacy practices regarding image storage and deletion.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onDecline}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              I Accept Terms & Conditions
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            You must accept these terms to create an account
          </p>
        </div>
      </div>
    </div>
  );
}

