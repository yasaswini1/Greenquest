import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Eye, Clock, FileText, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

interface Ticket {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  description: string;
  activity_type: string;
  category: string;
  current_points: number;
  ai_score: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  new_points?: number;
  evidence_count: number;
  created_at: string;
  resolved_at?: string;
}

export function AdminDashboard() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [newPoints, setNewPoints] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await api.fetchAdminTickets(token || '', status);
      setTickets(response.tickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    try {
      const response = await api.fetchAdminTicketDetails(token || '', ticketId);
      setTicketDetails(response);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadTicketDetails(ticket.id);
    setNewPoints(ticket.current_points.toString());
    setAdminNotes('');
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedTicket) return;

    if (action === 'approve' && !newPoints) {
      alert('Please enter new points for approval');
      return;
    }

    try {
      setReviewing(true);
      await api.reviewTicket(
        token || '',
        selectedTicket.id,
        action,
        action === 'approve' ? Number(newPoints) : undefined,
        adminNotes || undefined
      );
      await loadTickets();
      setSelectedTicket(null);
      setTicketDetails(null);
      alert(`Ticket ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to review ticket');
    } finally {
      setReviewing(false);
    }
  };

  const pendingCount = tickets.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ticket Review Dashboard</h1>
          <p className="text-gray-600">Review and resolve user escalation tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <Loader className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tickets found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-gray-900 font-medium">{ticket.user_name}</p>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {ticket.user_email}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ticket.activity_type}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {ticket.category}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                            AI Score: {ticket.ai_score}%
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {ticket.evidence_count} evidence
                          </span>
                          {ticket.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {ticket.status === 'approved' && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {ticket.status === 'rejected' && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-xs flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-900 font-medium">{ticket.current_points} pts</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          {selectedTicket && ticketDetails ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 sticky top-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="text-gray-900">{selectedTicket.user_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activity:</span>
                    <span className="text-gray-900">{selectedTicket.activity_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-gray-900">{selectedTicket.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Points:</span>
                    <span className="text-gray-900">{selectedTicket.current_points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Score:</span>
                    <span className="text-gray-900">{selectedTicket.ai_score}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {selectedTicket.description}
                </p>
              </div>

              {ticketDetails.evidence && ticketDetails.evidence.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Evidence Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ticketDetails.evidence.map((ev: any) => {
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                      return (
                        <img
                          key={ev.id}
                          src={`${API_URL}${ev.image_path}`}
                          alt="Evidence"
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTicket.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Points (if approving)
                    </label>
                    <input
                      type="number"
                      value={newPoints}
                      onChange={(e) => setNewPoints(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      placeholder={selectedTicket.current_points.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Optional notes..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReview('approve')}
                      disabled={reviewing}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {reviewing ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview('reject')}
                      disabled={reviewing}
                      className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                      {reviewing ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedTicket.status !== 'pending' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        selectedTicket.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                      </span>
                    </div>
                    {selectedTicket.new_points && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Points:</span>
                        <span className="text-gray-900">{selectedTicket.new_points}</span>
                      </div>
                    )}
                    {selectedTicket.admin_notes && (
                      <div>
                        <span className="text-gray-600">Admin Notes:</span>
                        <p className="text-gray-900 mt-1">{selectedTicket.admin_notes}</p>
                      </div>
                    )}
                    {selectedTicket.resolved_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved:</span>
                        <span className="text-gray-900">
                          {new Date(selectedTicket.resolved_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a ticket to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

