import React, { useEffect, useState } from 'react';
import { Upload, Camera, MapPin, Calendar, CheckCircle2, AlertTriangle, Target, RefreshCw, X, Globe, Lock, Cpu, Loader, AlertCircle, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { TicketCreationView } from './TicketCreationView';

type ActivityType = 'transport' | 'plastic' | 'energy' | 'water' | 'tree' | 'event';

const activityTypes = [
  { id: 'transport', name: 'Sustainable Transport', description: 'Walking, cycling, public transport, EV', points: '20-50' },
  { id: 'plastic', name: 'Plastic Avoidance', description: 'Reusable bags, bottles, containers', points: '15-30' },
  { id: 'energy', name: 'Energy Reduction', description: 'Reduced electricity/water bill', points: '30-100' },
  { id: 'water', name: 'Water Conservation', description: 'Reduced water consumption', points: '25-75' },
  { id: 'tree', name: 'Tree Planting', description: 'Plant trees or saplings', points: '50-150' },
  { id: 'event', name: 'Eco Event', description: 'Clean-up drives, workshops', points: '40-120' },
];

export function SubmitActivityView() {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
  const [formValues, setFormValues] = useState({ description: '', points: '', co2Saved: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [locationLabel, setLocationLabel] = useState('');
  const [geoCoords, setGeoCoords] = useState<{ lat: number | null; lng: number | null; accuracy: number | null }>({
    lat: null,
    lng: null,
    accuracy: null,
  });
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ points: number; co2Saved: number; geoBonus?: number; aiVerification?: any; activityId?: string; challengeCompleted?: any } | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ score: number; label: string; matches: boolean } | null>(null);
  const [showTicketCreation, setShowTicketCreation] = useState(false);
  const { token, refreshProfile } = useAuth();

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleUseLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setSubmitError('Geolocation is not supported in this browser.');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setGeoCoords({ lat, lng, accuracy: accuracy ?? null });
        if (!locationLabel) {
          setLocationLabel(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
        }
        setGeoStatus('idle');
      },
      (err) => {
        setGeoStatus('error');
        setSubmitError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleClearLocation = () => {
    setLocationLabel('');
    setGeoCoords({ lat: null, lng: null, accuracy: null });
  };

  const handleResetEventTime = () => {
    setEventTime(new Date().toISOString().slice(0, 16));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageFile(file || null);
    setSubmitError(null);
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile || !selectedType || !token) return;
    
    setAnalyzing(true);
    setSubmitError(null);
    
    // Show a message that this may take a while
    console.log('[UI] Starting AI analysis - this may take 30-120 seconds...');
    
    try {
      // Create a temporary form data to send for analysis
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('category', selectedType);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      // Call the analysis endpoint
      const response = await fetch(`${API_URL}/api/activities/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAiAnalysisResult({
          score: data.aiScore || 0,
          label: data.label || 'unknown',
          matches: data.matches || false,
        });
        setSubmitError(null);
      } else {
        const errorMsg = data.message || 'AI analysis failed';
        if (data.error === 'OLLAMA_NOT_AVAILABLE') {
          setSubmitError('Ollama is not running. Please start Ollama: ollama serve');
        } else {
          setSubmitError(errorMsg);
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setSubmitError('Failed to connect to server. Please make sure the server is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    if (!token) {
      setSubmitError('You must be logged in to submit an activity.');
      return;
    }
    if (!selectedType) {
      setSubmitError('Select an activity type to continue.');
      return;
    }
    if (!imageFile) {
      setSubmitError('Image evidence is required.');
      return;
    }

    setSubmitError(null);
    setLoading(true);
    setAnalyzing(true);
    
    try {
      // First, analyze the image with AI
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('category', selectedType);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const analysisResponse = await fetch(`${API_URL}/api/activities/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.message || 'AI analysis failed');
      }
      
      const analysisResult = await analysisResponse.json();
      setAiAnalysisResult({
        score: analysisResult.aiScore || 0,
        label: analysisResult.label || 'unknown',
        matches: analysisResult.matches || false,
      });

      // Then submit the activity
      const payload = new FormData();
      payload.append('type', activityTypes.find((t) => t.id === selectedType)?.name ?? selectedType);
      payload.append('category', selectedType);
      payload.append('description', formValues.description);
      if (formValues.points) payload.append('points', formValues.points);
      if (formValues.co2Saved) payload.append('co2Saved', formValues.co2Saved);
      if (eventTime) payload.append('eventTime', new Date(eventTime).toISOString());
      if (locationLabel) payload.append('location', locationLabel.trim());
      if (geoCoords.lat !== null && geoCoords.lng !== null) {
        payload.append('latitude', String(geoCoords.lat));
        payload.append('longitude', String(geoCoords.lng));
        if (geoCoords.accuracy !== null) {
          payload.append('geoAccuracy', String(geoCoords.accuracy));
        }
      }
      payload.append('visibility', visibility);
      payload.append('image', imageFile);
      // Send AI analysis result to server
      payload.append('aiAnalysisResult', JSON.stringify({
        score: analysisResult.score,
        label: analysisResult.label,
        matches: analysisResult.matches,
      }));

      const response = await api.submitActivity(payload, token);
      console.log('Submission response:', response);
      console.log('AI Verification:', response.aiVerification);
      console.log('Emissions:', response.aiVerification?.emissions);
      setSubmissionResult({
        points: response.activity.points,
        co2Saved: response.activity.co2_saved,
        geoBonus: response.geoBonus,
        aiVerification: response.aiVerification,
        activityId: response.activity.id,
        challengeCompleted: response.challengeCompleted,
      });
      refreshProfile();
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setStep('select');
    setFormValues({ description: '', points: '', co2Saved: '' });
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setEventTime(new Date().toISOString().slice(0, 16));
    setLocationLabel('');
    setGeoCoords({ lat: null, lng: null, accuracy: null });
    setGeoStatus('idle');
    setSubmitError(null);
    setSubmissionResult(null);
    setVisibility('private');
    setAiAnalysisResult(null);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-4xl">
      {step === 'select' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900 mb-2">Select Activity Type</h2>
            <p className="text-gray-600">Choose the type of sustainable activity you want to log</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activityTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id as ActivityType)}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <h3 className="text-gray-900 mb-2">{type.name}</h3>
                <p className="text-gray-600 mb-3">{type.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    {type.points} points
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && selectedType && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-gray-900 mb-2">Log Your Activity</h2>
              <p className="text-gray-600">
                {activityTypes.find((t) => t.id === selectedType)?.name}
              </p>
            </div>
            <button onClick={resetForm} className="text-gray-600 hover:text-gray-900">
              Change Type
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Photo Evidence *</label>
                <div className="relative">
                  <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                    {imagePreview ? (
                      <div className="space-y-3 relative">
                        <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                        <p className="text-sm text-gray-500">Click to replace the image</p>
                      </div>
                    ) : (
                      <div>
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 mb-1">Click to upload or drag and drop</p>
                        <p className="text-gray-500">Maximum file size: 10MB</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors shadow-lg z-10"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* AI Analysis Results */}
                {aiAnalysisResult && (
                  <div className="mt-3">
                    <div className={`border rounded-lg p-4 ${
                      aiAnalysisResult.matches
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Cpu className={`w-5 h-5 ${aiAnalysisResult.matches ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span className={`text-sm font-medium ${aiAnalysisResult.matches ? 'text-emerald-700' : 'text-amber-700'}`}>
                            AI Verification Complete
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${aiAnalysisResult.matches ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {aiAnalysisResult.score}%
                        </span>
                      </div>
                      {aiAnalysisResult.matches ? (
                        <p className="text-sm text-emerald-700">
                          ✓ Detected: {aiAnalysisResult.label} - Matches {selectedType} category
                        </p>
                      ) : (
                        <p className="text-sm text-amber-700">
                          ⚠ Detected: {aiAnalysisResult.label} - May not match {selectedType} category. Points will be reduced.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setAiAnalysisResult(null)}
                        className="mt-2 text-xs text-gray-600 hover:text-gray-800 underline"
                      >
                        Re-analyze
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Location</label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        className="bg-transparent flex-1 outline-none"
                        placeholder="Type an address or landmark"
                        value={locationLabel}
                        onChange={(e) => setLocationLabel(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
                        disabled={geoStatus === 'locating'}
                      >
                        <Target className="w-4 h-4" />
                        {geoStatus === 'locating' ? 'Locating…' : 'Use my location'}
                      </button>
                      {(locationLabel || geoCoords.lat !== null) && (
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          className="px-4 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {geoCoords.lat !== null && geoCoords.lng !== null && (
                    <p className="text-xs text-emerald-700">
                      Lat {geoCoords.lat.toFixed(4)}, Lng {geoCoords.lng.toFixed(4)}{' '}
                      {geoCoords.accuracy !== null ? `(±${Math.round(geoCoords.accuracy)}m)` : ''}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    You can edit the location at any time. Precise coordinates add bonus points automatically.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Date & Time</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex-1">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      className="bg-transparent flex-1 outline-none"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetEventTime}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Now
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Add any additional context or details..."
                  value={formValues.description}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Post Visibility</label>
                <p className="text-xs text-gray-500 mb-3">Choose who can see this activity in the feed</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      visibility === 'private'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                    <span className="text-sm font-medium">Private</span>
                    <span className="text-xs text-gray-500">Only you</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      visibility === 'public'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">Public</span>
                    <span className="text-xs text-gray-500">Everyone</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Points (optional)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 40"
                    value={formValues.points}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, points: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">CO₂ Saved (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 3.5"
                    value={formValues.co2Saved}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, co2Saved: e.target.value }))}
                  />
                </div>
              </div>

              {submitError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{submitError}</span>
                </div>
              )}

                <button
                  onClick={handleUpload}
                  disabled={loading || analyzing}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || analyzing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Submit Activity</span>
                  </>
                )}
              </button>
              {!aiAnalysisResult && (
                <p className="text-xs text-amber-600 text-center mt-2">
                  Please analyze your image with AI before submitting
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-gray-900 mb-2">Activity Logged!</h2>
            <p className="text-gray-600 mb-6">Your submission has been recorded and points awarded.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-300">
                <p className="text-emerald-600 text-xs mb-1 font-medium">Points Earned</p>
                <p className="text-emerald-900 text-2xl font-bold">
                  {submissionResult ? `+${submissionResult.points}` : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 mb-1">CO₂ Saved</p>
                <p className="text-gray-900">
                  {submissionResult ? `${submissionResult.co2Saved.toFixed(1)} kg` : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 mb-1">Geo Bonus</p>
                <p className="text-gray-900">
                  {submissionResult?.geoBonus ? `+${submissionResult.geoBonus}` : '—'}
                </p>
              </div>
              {submissionResult?.aiVerification && (
                <div className={`rounded-lg p-4 border-2 ${
                  submissionResult.aiVerification.matches 
                    ? 'bg-emerald-50 border-emerald-300' 
                    : 'bg-amber-50 border-amber-300'
                }`}>
                  <p className={`text-xs mb-1 font-medium ${
                    submissionResult.aiVerification.matches ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    AI Score
                  </p>
                  <p className={`text-2xl font-bold ${
                    submissionResult.aiVerification.matches ? 'text-emerald-900' : 'text-amber-900'
                  }`}>
                    {submissionResult.aiVerification.score}%
                  </p>
                  <p className={`text-xs mt-1 ${
                    submissionResult.aiVerification.matches ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {submissionResult.aiVerification.matches ? '✓ Verified' : '⚠ Low Score'}
                  </p>
                </div>
              )}
            </div>

            {/* Emissions box centered in the middle */}
            {submissionResult?.aiVerification && (
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300 max-w-md w-full">
                  <p className="text-blue-600 text-sm mb-2 font-medium text-center">AI Processing Emissions</p>
                  <div className="text-center">
                    <p className="text-blue-900 text-2xl font-bold">
                      {((submissionResult.aiVerification?.emissions?.co2_kg) ?? 0).toFixed(6)} kg CO₂
                    </p>
                    <p className="text-blue-700 text-sm mt-2">
                      Energy: {((submissionResult.aiVerification?.emissions?.energy_kwh) ?? 0).toFixed(6)} kWh
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      Duration: {((submissionResult.aiVerification?.emissions?.duration_seconds) ?? 0).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            )}

            {submissionResult?.geoBonus ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 mb-6">
                +{submissionResult.geoBonus} bonus points awarded for verified geolocation
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">
                Tip: add precise geolocation next time to earn instant bonus points.
              </p>
            )}

            {submissionResult?.aiVerification && submissionResult.aiVerification.score < 60 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Low AI Verification Score
                    </p>
                    <p className="text-sm text-amber-700 mb-3">
                      The AI assessment gave a low score ({submissionResult.aiVerification.score}%). 
                      If you believe this is incorrect, you can raise a ticket for admin review.
                    </p>
                    <button
                      onClick={() => setShowTicketCreation(true)}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                    >
                      Raise a Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Submit Another Activity
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showTicketCreation && submissionResult && selectedType && (
        <TicketCreationView
          activityId={submissionResult.activityId || ''}
          activityType={activityTypes.find(t => t.id === selectedType)?.name || selectedType}
          category={activityTypes.find(t => t.id === selectedType)?.name || selectedType}
          currentPoints={submissionResult.points}
          aiScore={submissionResult.aiVerification?.score || 0}
          onClose={() => setShowTicketCreation(false)}
          onSuccess={() => {
            setShowTicketCreation(false);
            // Optionally show a success message
          }}
        />
      )}
    </div>
  );
}











