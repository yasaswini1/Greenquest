import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Eye, TrendingUp, Users, Activity, Shield } from 'lucide-react';

const flaggedSubmissions = [
  {
    id: '1',
    user: 'John Doe',
    userId: 'user_789',
    activity: 'Walking 5km',
    category: 'Transport',
    date: '2025-11-19 14:30',
    points: 20,
    aiScore: 68,
    flags: [
      { type: 'GPS Anomaly', severity: 'high', confidence: 85 },
      { type: 'Metadata Inconsistency', severity: 'medium', confidence: 72 },
    ],
    fraudChecks: {
      imageAuth: 72,
      gps: 65,
      metadata: 68,
      content: 70,
      fraud: 66
    },
    status: 'pending'
  },
  {
    id: '2',
    user: 'Jane Smith',
    userId: 'user_456',
    activity: 'Tree Planting',
    category: 'Nature',
    date: '2025-11-19 11:00',
    points: 100,
    aiScore: 71,
    flags: [
      { type: 'Image Similarity Match', severity: 'high', confidence: 92 },
      { type: 'Duplicate Detection', severity: 'high', confidence: 88 },
    ],
    fraudChecks: {
      imageAuth: 68,
      gps: 75,
      metadata: 70,
      content: 73,
      fraud: 65
    },
    status: 'pending'
  },
  {
    id: '3',
    user: 'Mike Wilson',
    userId: 'user_123',
    activity: 'Public Transport',
    category: 'Transport',
    date: '2025-11-18 16:45',
    points: 25,
    aiScore: 74,
    flags: [
      { type: 'Timestamp Anomaly', severity: 'medium', confidence: 76 },
    ],
    fraudChecks: {
      imageAuth: 78,
      gps: 72,
      metadata: 69,
      content: 76,
      fraud: 73
    },
    status: 'pending'
  },
];

const platformStats = {
  totalUsers: 12847,
  activeToday: 3421,
  totalActivities: 89234,
  verifiedActivities: 85123,
  flaggedActivities: 127,
  totalPoints: 4523000,
  totalCO2: 12847.5,
  avgTrustScore: 96.3,
};

export function AdminView() {
  const [selectedSubmission, setSelectedSubmission] = useState<typeof flaggedSubmissions[0] | null>(null);

  const handleApprove = (id: string) => {
    console.log('Approved:', id);
    // In real app, call API to approve
  };

  const handleReject = (id: string) => {
    console.log('Rejected:', id);
    // In real app, call API to reject
  };

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={platformStats.totalUsers.toLocaleString()}
          change="+847 this week"
          color="text-blue-600"
        />
        <StatCard
          icon={Activity}
          label="Total Activities"
          value={platformStats.totalActivities.toLocaleString()}
          change="+2,341 this week"
          color="text-emerald-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Flagged"
          value={platformStats.flaggedActivities.toString()}
          change="Review pending"
          color="text-rose-600"
        />
        <StatCard
          icon={Shield}
          label="Avg Trust Score"
          value={`${platformStats.avgTrustScore}%`}
          change="Platform health"
          color="text-purple-600"
        />
      </div>

      {/* Flagged Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-900">Flagged Submissions</h2>
                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full">
                  {flaggedSubmissions.length} pending
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {flaggedSubmissions.map((submission) => (
                <FlaggedSubmissionRow
                  key={submission.id}
                  submission={submission}
                  isSelected={selectedSubmission?.id === submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          {selectedSubmission ? (
            <SubmissionDetails
              submission={selectedSubmission}
              onApprove={() => handleApprove(selectedSubmission.id)}
              onReject={() => handleReject(selectedSubmission.id)}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a submission to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-6">Platform Health Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthMetric
            label="Verification Rate"
            value="95.4%"
            status="good"
            description="Activities passing AI verification"
          />
          <HealthMetric
            label="Fraud Detection"
            value="1.4%"
            status="good"
            description="Flagged submissions rate"
          />
          <HealthMetric
            label="Manual Review Time"
            value="2.3 hrs"
            status="warning"
            description="Avg time to resolve flags"
          />
        </div>
      </div>

      {/* ESG Reporting */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-6">ESG Impact Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ESGCard
            icon="🌍"
            metric="CO₂ Reduced"
            value={`${platformStats.totalCO2.toLocaleString()} kg`}
            equivalent="2,847 trees planted"
          />
          <ESGCard
            icon="👥"
            metric="Community Size"
            value={platformStats.totalUsers.toLocaleString()}
            equivalent="12 cities"
          />
          <ESGCard
            icon="⚡"
            metric="Activities Completed"
            value={platformStats.totalActivities.toLocaleString()}
            equivalent="This month"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  change: string; 
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <Icon className={`w-6 h-6 ${color} mb-3`} />
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 mb-1">{value}</p>
      <p className="text-gray-500">{change}</p>
    </div>
  );
}

function FlaggedSubmissionRow({ 
  submission, 
  isSelected,
  onClick 
}: { 
  submission: any; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const highSeverityFlags = submission.flags.filter((f: any) => f.severity === 'high').length;

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 text-left hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-rose-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-gray-900">{submission.user}</p>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {submission.userId}
            </span>
          </div>
          <p className="text-gray-600 mb-1">{submission.activity}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {submission.category}
            </span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs">
              AI Score: {submission.aiScore}%
            </span>
            {highSeverityFlags > 0 && (
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {highSeverityFlags} high
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-gray-900">+{submission.points}</p>
          <p className="text-gray-500">{new Date(submission.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {submission.flags.map((flag: any, index: number) => (
          <span 
            key={index}
            className={`px-2 py-1 rounded text-xs ${
              flag.severity === 'high' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {flag.type}
          </span>
        ))}
      </div>
    </button>
  );
}

function SubmissionDetails({ 
  submission, 
  onApprove, 
  onReject 
}: { 
  submission: any; 
  onApprove: () => void; 
  onReject: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-gray-900 mb-4">Review Details</h3>
        <div className="space-y-3">
          <DetailRow label="User" value={submission.user} />
          <DetailRow label="Activity" value={submission.activity} />
          <DetailRow label="Category" value={submission.category} />
          <DetailRow label="Points" value={`+${submission.points}`} />
          <DetailRow label="Date" value={new Date(submission.date).toLocaleString()} />
        </div>
      </div>

      <div>
        <h4 className="text-gray-900 mb-3">AI Checks</h4>
        <div className="space-y-2">
          <CheckBar label="Image Auth" value={submission.fraudChecks.imageAuth} />
          <CheckBar label="GPS" value={submission.fraudChecks.gps} />
          <CheckBar label="Metadata" value={submission.fraudChecks.metadata} />
          <CheckBar label="Content" value={submission.fraudChecks.content} />
          <CheckBar label="Fraud Score" value={submission.fraudChecks.fraud} />
        </div>
      </div>

      <div>
        <h4 className="text-gray-900 mb-3">Flags Detected</h4>
        <div className="space-y-2">
          {submission.flags.map((flag: any, index: number) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border-2 ${
                flag.severity === 'high' 
                  ? 'border-rose-200 bg-rose-50' 
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={flag.severity === 'high' ? 'text-rose-900' : 'text-amber-900'}>
                  {flag.type}
                </span>
                <span className={flag.severity === 'high' ? 'text-rose-700' : 'text-amber-700'}>
                  {flag.confidence}% confidence
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${
                flag.severity === 'high' 
                  ? 'bg-rose-200 text-rose-800' 
                  : 'bg-amber-200 text-amber-800'
              }`}>
                {flag.severity} severity
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />
          Approve
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-colors"
        >
          <XCircle className="w-5 h-5" />
          Reject
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function CheckBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-700">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            value >= 90 ? 'bg-emerald-500' : value >= 70 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function HealthMetric({ 
  label, 
  value, 
  status, 
  description 
}: { 
  label: string; 
  value: string; 
  status: 'good' | 'warning' | 'critical';
  description: string;
}) {
  const statusColors = {
    good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColors[status]}`}>
      <p className="mb-1">{label}</p>
      <p className="text-2xl mb-2">{value}</p>
      <p className="opacity-80">{description}</p>
    </div>
  );
}

function ESGCard({ 
  icon, 
  metric, 
  value, 
  equivalent 
}: { 
  icon: string; 
  metric: string; 
  value: string; 
  equivalent: string;
}) {
  return (
    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-600 mb-1">{metric}</p>
      <p className="text-gray-900 mb-2">{value}</p>
      <p className="text-emerald-600">≈ {equivalent}</p>
    </div>
  );
}
