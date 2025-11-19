const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const activityLevels = [3, 5, 7, 4, 6, 9, 5]; // 0-10 scale

export function WeeklyActivity() {
  const getColor = (level: number) => {
    if (level === 0) return 'bg-gray-100';
    if (level <= 2) return 'bg-emerald-100';
    if (level <= 4) return 'bg-emerald-200';
    if (level <= 6) return 'bg-emerald-400';
    if (level <= 8) return 'bg-emerald-600';
    return 'bg-emerald-700';
  };

  return (
    <div className="space-y-2">
      {days.map((day, index) => (
        <div key={day} className="flex items-center gap-3">
          <span className="text-gray-600 w-8">{day}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div 
              className={`h-full ${getColor(activityLevels[index])} transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${(activityLevels[index] / 10) * 100}%` }}
            >
              {activityLevels[index] > 4 && (
                <span className="text-white text-xs">{activityLevels[index]}</span>
              )}
            </div>
          </div>
          {activityLevels[index] <= 4 && (
            <span className="text-gray-600 text-xs w-4">{activityLevels[index]}</span>
          )}
        </div>
      ))}
    </div>
  );
}
