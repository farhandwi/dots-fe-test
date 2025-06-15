import { Database } from 'lucide-react';

const TotalDataDisplay = ({ total }: {total: number | null}) => {
  if (!total) return null;
  
  return (
    <div className="flex items-center gap-2 mb-4 bg-blue-50 p-2 rounded-md w-fit">
      <Database className="h-5 w-5 text-blue-600" />
      <span className="text-sm font-medium">
        Total Records: <span className="text-blue-600">{total.toLocaleString()}</span>
      </span>
    </div>
  );
};

export default TotalDataDisplay;