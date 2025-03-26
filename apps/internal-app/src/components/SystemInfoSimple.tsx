import React, { useState, useEffect } from 'react';

// JSON display component props interface
interface JsonDisplayProps {
  data: any;
  expanded: boolean;
  level?: number;
  maxKeyLength?: number;
}

// JSON display component
const JsonDisplay: React.FC<JsonDisplayProps> = ({ 
  data, 
  expanded, 
  level = 0, 
  maxKeyLength = 0 
}) => {
  // For null/undefined values
  if (data === null || data === undefined) {
    return <span style={{ color: 'var(--neon-yellow)' }}>null</span>;
  }

  // For primitive values (string, number, boolean)
  if (typeof data !== 'object') {
    const valueColor = 
      typeof data === 'string' ? 'var(--neon-pink)' : 
      typeof data === 'number' ? 'var(--neon-cyan)' : 'var(--neon-yellow)';
    
    // Limit long string values to prevent overflow
    const displayValue = typeof data === 'string' && data.length > 100 
      ? `${data.substring(0, 100)}...` 
      : String(data);
    
    return <span style={{ color: valueColor }}>{displayValue}</span>;
  }

  // For arrays and objects
  const isArray = Array.isArray(data);
  const isEmpty = isArray ? data.length === 0 : Object.keys(data).length === 0;

  if (isEmpty) {
    return <span style={{ color: 'var(--neon-purple)' }}>{isArray ? '[]' : '{}'}</span>;
  }

  // If not expanded or level is too deep, show a preview
  if (!expanded || level > 3) {
    const count = isArray ? data.length : Object.keys(data).length;
    const preview = isArray 
      ? `[${count} ${count === 1 ? 'item' : 'items'}]` 
      : `{${count} ${count === 1 ? 'field' : 'fields'}}`;
    
    return <span style={{ color: 'var(--neon-yellow)' }}>{preview}</span>;
  }

  // Calculate max key length for better alignment at this level
  const keys = isArray ? [] : Object.keys(data);
  const currentMaxKeyLength = keys.reduce((max, key) => Math.max(max, key.length), 0);
  
  // Full expanded view - vertical display
  return (
    <div className="json-block" style={{ 
      display: 'flex',
      flexDirection: 'column',
      paddingLeft: level === 0 ? 0 : '12px',
      borderLeft: level === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
      marginLeft: level === 0 ? 0 : '4px',
    }}>
      <div>
        <span style={{ color: 'var(--neon-purple)' }}>
          {isArray ? '[' : '{'}
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {isArray
          ? data.map((item, index) => {
              // For arrays, collapse after a certain number of items
              if (index > 20 && data.length > 30) {
                return index === 21 ? (
                  <div key="collapsed" style={{ paddingLeft: '12px', color: 'var(--neon-yellow)' }}>
                    ... {data.length - 21} more items
                  </div>
                ) : null;
              }
              
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--neon-cyan)', minWidth: '24px' }}>{index}:</span>
                  <JsonDisplay 
                    data={item} 
                    expanded={expanded} 
                    level={level + 1}
                    maxKeyLength={currentMaxKeyLength} 
                  />
                </div>
              );
            })
          : keys.map((key, index) => (
              <div key={key} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span 
                  style={{ 
                    color: 'var(--neon-yellow)', 
                    minWidth: `${Math.min(Math.max(currentMaxKeyLength * 8, 60), 120)}px`,
                    paddingRight: '8px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {key}:
                </span>
                <JsonDisplay 
                  data={data[key]} 
                  expanded={expanded} 
                  level={level + 1}
                  maxKeyLength={currentMaxKeyLength} 
                />
              </div>
            ))}
      </div>
      
      <div>
        <span style={{ color: 'var(--neon-purple)' }}>
          {isArray ? ']' : '}'}
        </span>
      </div>
    </div>
  );
};

function SystemInfo() {
  const [payloadData, setPayloadData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showFullResponse, setShowFullResponse] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch agent status
    const fetchAgentStatus = async () => {
      setIsLoading(true);
      setError(null);
      const apiHost = import.meta.env.VITE_INTERNAL_API_HOST || 'internal-api';
      const apiPort = import.meta.env.VITE_INTERNAL_API_PORT || '3030';
      const apiUrl = `http://${apiHost}:${apiPort}/api/data/agent_status`;

      try {
        // Fetch data
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Extract and store just the payload data
        let extractedPayload = null;
        
        if (data?.data) {
          extractedPayload = data.data;
          // Try to parse if it's a string
          if (typeof extractedPayload === 'string') {
            try {
              extractedPayload = JSON.parse(extractedPayload);
            } catch (e) {
              console.log('Could not parse payload as JSON, keeping as string');
            }
          }
        } else if (data?.value) {
          extractedPayload = data.value;
          // Try to parse if it's a string
          if (typeof extractedPayload === 'string') {
            try {
              extractedPayload = JSON.parse(extractedPayload);
            } catch (e) {
              console.log('Could not parse value as JSON, keeping as string');
            }
          }
        }
        
        setPayloadData(extractedPayload);
      } catch (error) {
        console.error('Error fetching status:', error);
        setError('Failed to fetch data');
      } finally {
        setLastUpdated(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAgentStatus();

    // Set up interval to fetch agent status every 3 seconds
    const statusInterval = setInterval(fetchAgentStatus, 3000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="payload-display w-[300px]" style={{ height: '100%', overflow: 'hidden' }}>
      <div className="flex flex-col h-full p-2">
        {/* Compact header */}
        <div className="flex justify-between items-center mb-2" style={{ height: '28px' }}>
          <div className="flex items-center">
            <h2
              className="text-sm font-semibold mr-2"
              style={{
                color: 'var(--neon-purple)',
              }}
            >
              AGENT INTERNALS
            </h2>
            {isLoading && (
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: 'var(--neon-cyan)',
                  boxShadow: '0 0 5px var(--neon-cyan)',
                }}
              />
            )}
          </div>
          {lastUpdated && (
            <div className="text-xs">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                {lastUpdated}
              </span>
            </div>
          )}
        </div>

        {/* Payload Display - Taking most of the space */}
        <div
          className="flex-grow rounded-md overflow-auto"
          style={{
            background: 'rgba(15, 15, 18, 0.8)',
            border: '1px solid rgba(128, 90, 213, 0.4)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          {error ? (
            <div className="flex items-center justify-center h-full">
              <span style={{ color: 'var(--neon-pink)' }}>{error}</span>
            </div>
          ) : payloadData ? (
            <div
              className="font-mono p-3 h-full"
              style={{
                color: 'var(--neon-green)',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              <JsonDisplay 
                data={payloadData} 
                expanded={showFullResponse} 
                level={0}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span style={{ color: 'var(--neon-yellow)' }}>No data</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemInfo; 