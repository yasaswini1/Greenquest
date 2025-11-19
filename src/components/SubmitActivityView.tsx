import { useEffect, useState } from 'react';
import { Upload, Camera, MapPin, Calendar, CheckCircle2, AlertTriangle, Target, RefreshCw, X, Globe, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

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
  const [submissionResult, setSubmissionResult] = useState<{ points: number; co2Saved: number; geoBonus?: number } | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
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
    try {
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

      const response = await api.submitActivity(payload, token);
      setSubmissionResult({
        points: response.activity.points,
        co2Saved: response.activity.co2_saved,
        geoBonus: response.geoBonus,
      });
      refreshProfile();
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
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
                      className="absolute top-2 right-2 bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors shadow-lg"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                {loading ? 'Submitting…' : 'Submit Activity'}
              </button>
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 mb-1">Points Earned</p>
                <p className="text-gray-900">
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
            </div>

            {submissionResult?.geoBonus ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 mb-6">
                +{submissionResult.geoBonus} bonus points awarded for verified geolocation
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">
                Tip: add precise geolocation next time to earn instant bonus points.
              </p>
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
    </div>
  );
}
