import React, { useState, useEffect } from 'react';

// JSON display component props interface
interface JsonDisplayProps {
  data: any;
  expanded: boolean;
}

// JSON display component
const JsonDisplay: React.FC<JsonDisplayProps> = ({ data, expanded }) => {
  // For null/undefined values
  if (data === null || data === undefined) {
    return <span style={{ color: 'var(--neon-yellow)' }}>null</span>;
  }

  // For primitive values (string, number, boolean)
  if (typeof data !== 'object') {
    const valueColor = 
      typeof data === 'string' ? 'var(--neon-pink)' : 
      typeof data === 'number' ? 'var(--neon-cyan)' : 'var(--neon-yellow)';
    
    return <span style={{ color: valueColor }}>{String(data)}</span>;
  }

  // For arrays and objects
  const isArray = Array.isArray(data);
  const entries = isArray ? data : Object.entries(data);
  const isEmpty = isArray ? data.length === 0 : Object.keys(data).length === 0;

  if (isEmpty) {
    return <span style={{ color: 'var(--neon-purple)' }}>{isArray ? '[]' : '{}'}</span>;
  }

  // If not expanded and it's a complex object, show a preview
  if (!expanded) {
    return (
      <div>
        <span style={{ color: 'var(--neon-purple)' }}>
          {isArray ? '[' : '{'}
        </span>
        <span style={{ color: 'var(--neon-yellow)' }}>
          {' '}...{isArray ? data.length : Object.keys(data).length} items{' '}
        </span>
        <span style={{ color: 'var(--neon-purple)' }}>
          {isArray ? ']' : '}'}
        </span>
      </div>
    );
  }

  // Full expanded view
  return (
    <div className="pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
      <div>
        <span style={{ color: 'var(--neon-purple)' }}>
          {isArray ? '[' : '{'}
        </span>
      </div>
      {isArray
        ? data.map((item, index) => (
            <div key={index} className="ml-2">
              <span style={{ color: 'var(--neon-cyan)' }}>{index}: </span>
              <JsonDisplay data={item} expanded={expanded} />
              {index < data.length - 1 && <span style={{ color: 'white' }}>,</span>}
            </div>
          ))
        : Object.entries(data).map(([key, value], index, arr) => (
            <div key={key} className="ml-2">
              <span style={{ color: 'var(--neon-yellow)' }}>{key}: </span>
              <JsonDisplay data={value} expanded={expanded} />
              {index < arr.length - 1 && <span style={{ color: 'white' }}>,</span>}
            </div>
          ))}
      <div>
        <span style={{ color: 'var(--neon-purple)' }}>
          {isArray ? ']' : '}'}
        </span>
      </div>
    </div>
  );
};

function SystemInfo() {
  // Simplified state to just show what we need in the UI
  const [memory, setMemory] = useState(Math.floor(Math.random() * 70) + 30);
  const [statusText, setStatusText] = useState('READY');
  const [statusModel, setStatusModel] = useState('');
  const [statusTool, setStatusTool] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    requests: 0,
    errors: 0,
    lastResponse: null,
  });
  const [rawResponse, setRawResponse] = useState(null);
  const [glitchText, setGlitchText] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);

  useEffect(() => {
    // Memory usage simulation (random number between 30 and 100)
    const memoryInterval = setInterval(() => {
      setMemory(Math.floor(Math.random() * 70) + 30);
    }, 5000);

    // Glitch text effect
    const glitchInterval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 200);
    }, 3000);

    // Simple fetch function that doesn't depend on state
    const fetchAgentStatus = async () => {
      setIsLoading(true);
      const apiHost = import.meta.env.VITE_INTERNAL_API_HOST || 'internal-api';
      const apiPort = import.meta.env.VITE_INTERNAL_API_PORT || '3030';
      const apiUrl = `http://${apiHost}:${apiPort}/api/data/agent_status`;

      try {
        // Simple fetch
        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log('API Response:', data);
        setDebugInfo((prev) => ({
          requests: prev.requests + 1,
          errors: prev.errors,
          lastResponse: data,
        }));

        // Store the raw response for display
        setRawResponse(data);

        // Process data (keeping existing logic)
        if (data?.data) {
          try {
            // The data appears to be a stringified JSON
            const parsedData = data.data;

            // First, check if it's a string and try to parse it directly
            if (typeof parsedData === 'string') {
              try {
                // Simple JSON parse first
                const parsed = JSON.parse(parsedData);
                if (parsed?.state) {
                  setStatusText(parsed.state.toUpperCase() || 'UNKNOWN');
                  setStatusModel(parsed.model || '');
                  setStatusTool(parsed.tool_name || '');
                  console.log('Successfully parsed the data string:', parsed);
                  return;
                }
              } catch (parseError) {
                console.log(
                  'First parsing attempt failed, trying alternative approach'
                );
              }

              // If the above fails, try an alternative approach for the heavily escaped format
              if (parsedData.includes('\\"state\\"')) {
                const stateMatch = parsedData.match(
                  /\\\"state\\\":\s*\\\"([^\\]+)\\\"/
                );
                if (stateMatch?.[1]) {
                  setStatusText(stateMatch[1].toUpperCase() || 'UNKNOWN');
                  console.log(
                    'Successfully extracted state using regex:',
                    stateMatch[1]
                  );
                } else {
                  console.log('No state found in cleaned data:', parsedData);
                  setStatusText('UNKNOWN');
                }
              } else {
                // Try to extract with simpler regex if the format is different
                const simpleStateMatch =
                  parsedData.match(/"state":\s*"([^"]+)"/);
                if (simpleStateMatch?.[1]) {
                  setStatusText(simpleStateMatch[1].toUpperCase() || 'UNKNOWN');
                  console.log(
                    'Successfully extracted state using simple regex:',
                    simpleStateMatch[1]
                  );
                } else {
                  console.log(
                    'No state found with simple regex in:',
                    parsedData
                  );
                  setStatusText('UNKNOWN');
                }
              }
            } else if (parsedData && typeof parsedData === 'object') {
              // If it's already an object, use it directly
              if (parsedData.state) {
                setStatusText(parsedData.state.toUpperCase() || 'UNKNOWN');
              }
              setStatusModel(parsedData.model || '');
              setStatusTool(parsedData.tool_name || '');
            }
          } catch (e) {
            console.error('Error parsing data.data:', e, data.data);
            setStatusText('PARSE ERROR');
          }
        }
        // Keep the existing logic for backward compatibility
        else if (data?.value) {
          let value = data.value;

          // Try to parse if it's a JSON string
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.warn('Failed to parse JSON string', e);
              setStatusText(value.state?.toUpperCase() || 'UNKNOWN');
            }
          }

          // Handle possible nested JSON strings
          if (
            value &&
            typeof value === 'object' &&
            value.state &&
            typeof value.state === 'string'
          ) {
            // Try to parse state if it looks like JSON
            if (value.state.startsWith('{') && value.state.endsWith('}')) {
              try {
                value.state = JSON.parse(value.state);
              } catch (e) {
                // If parsing fails, keep as string
                console.warn('Failed to parse nested state JSON string', e);
                setStatusText(value.state.toUpperCase() || 'UNKNOWN');
              }
            }
          }

          // Update UI state with whatever data we can extract
          if (typeof value === 'object') {
            setStatusText(
              value.state?.toUpperCase?.() ||
                (typeof value.state === 'string'
                  ? value.state.toUpperCase()
                  : 'UNKNOWN')
            );
            setStatusModel(value.model || '');
            setStatusTool(value.tool_name || '');
          } else {
            // If value is not an object (primitive type)
            setStatusText(String(value).toUpperCase() || 'UNKNOWN');
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
        setDebugInfo((prev) => ({
          requests: prev.requests + 1,
          errors: prev.errors + 1,
          lastResponse: prev.lastResponse,
        }));
      } finally {
        setLastUpdated(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAgentStatus();

    // Set up interval to fetch agent status every 2 seconds
    const statusInterval = setInterval(fetchAgentStatus, 2000);

    return () => {
      clearInterval(memoryInterval);
      clearInterval(statusInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  // Determine status indicator color
  const getStatusColor = () => {
    switch (statusText) {
      case 'COMPLETED':
      case 'CONTINUING':
        return 'var(--neon-green)';
      case 'ERROR':
        return 'var(--neon-pink)';
      case 'PROCESSING':
      case 'PROCESSING_RESPONSE':
      case 'USING_TOOLS':
      case 'CALLING_API':
        return 'var(--neon-cyan)';
      default:
        return 'var(--neon-purple)';
    }
  };

  // Calculate memory color
  const getMemoryColor = () => {
    if (memory > 80) return 'var(--neon-pink)';
    if (memory > 60) return 'var(--neon-yellow)';
    return 'var(--neon-cyan)';
  };

  return (
    <div className="overlay-element system-info">
      <div className="scan-line" />
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-3">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{
              color: 'var(--neon-purple)',
              textShadow: '0 0 5px var(--neon-purple)',
            }}
          >
            SYS.DIAGNOSTICS
          </span>
          <div
            className="px-2 py-0.5 text-xs"
            style={{
              border: '1px solid var(--neon-purple)',
              borderRadius: '2px',
              color: 'var(--neon-purple)',
            }}
          >
            v2.077
          </div>
        </div>

        {/* Memory usage section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span
              className="text-xs"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              MEMORY ALLOCATION
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: getMemoryColor() }}
            >
              {memory}%
            </span>
          </div>
          <div
            className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="h-full duration-500 ease-in-out"
              style={{
                width: `${memory}%`,
                background: getMemoryColor(),
                boxShadow: `0 0 10px ${getMemoryColor()}`,
              }}
            />
          </div>
        </div>

        {/* Status information */}
        <div
          className="p-3 bg-gray-800 bg-opacity-60 rounded-sm mb-3"
          style={{
            borderLeft: `2px solid ${getStatusColor()}`,
            borderBottom: `1px solid ${getStatusColor()}`,
            boxShadow: `0 0 10px rgba(0,0,0,0.5), 0 0 5px ${getStatusColor()}30`,
          }}
        >
          <div className="flex items-center mb-2">
            <div
              className="w-3 h-3 rounded-full mr-2 animate-pulse"
              style={{
                backgroundColor: getStatusColor(),
                boxShadow: `0 0 10px ${getStatusColor()}`,
              }}
            />
            <span
              className={`font-bold tracking-wide ${glitchText ? 'animate-glitch' : ''}`}
              style={{
                color: 'white',
                textShadow: `0 0 5px ${getStatusColor()}`,
              }}
            >
              {statusText || 'UNKNOWN'}
            </span>
            {isLoading && (
              <div
                className="ml-2 w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: 'var(--neon-cyan)',
                  boxShadow: '0 0 10px var(--neon-cyan)',
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {statusModel && (
              <div className="flex flex-col">
                <span
                  className="text-xs"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  MODEL
                </span>
                <span
                  className="text-sm truncate"
                  style={{ color: 'var(--neon-cyan)' }}
                >
                  {statusModel}
                </span>
              </div>
            )}

            {statusTool && (
              <div className="flex flex-col">
                <span
                  className="text-xs"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  TOOL
                </span>
                <span
                  className="text-sm truncate"
                  style={{ color: 'var(--neon-yellow)' }}
                >
                  {statusTool}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Last updated timestamp */}
        {lastUpdated && (
          <div className="text-xs mb-2 flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>LAST SYNC:</span>
            <span style={{ color: 'var(--neon-cyan)' }}>{lastUpdated}</span>
          </div>
        )}

        {/* API Response Display */}
        <div
          className="mt-2 p-2 rounded-sm text-xs"
          style={{
            background: 'rgba(15, 15, 18, 0.8)',
            borderLeft: '1px solid var(--neon-purple)',
            borderBottom: '1px solid var(--neon-purple)',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <div
              className="font-semibold"
              style={{ color: 'var(--neon-purple)' }}
            >
              API_RESPONSE:
            </div>
            <button
              onClick={() => setShowFullResponse(!showFullResponse)}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--neon-purple)',
                color: 'var(--neon-purple)',
              }}
            >
              {showFullResponse ? 'COLLAPSE' : 'EXPAND'}
            </button>
          </div>
          {rawResponse ? (
            <div
              className="break-all text-xs overflow-auto font-mono p-1 rounded"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--neon-green)',
                maxHeight: showFullResponse ? '300px' : '100px',
                transition: 'max-height 0.3s ease-in-out',
              }}
            >
              <JsonDisplay data={rawResponse} expanded={showFullResponse} />
            </div>
          ) : (
            <div
              className="text-center p-2"
              style={{ color: 'var(--neon-yellow)' }}
            >
              NO_DATA
            </div>
          )}
        </div>

        {/* Debug information */}
        <div
          className="mt-2 p-2 rounded-sm text-xs"
          style={{
            background: 'rgba(15, 15, 18, 0.8)',
            borderLeft: '1px solid var(--neon-yellow)',
            borderBottom: '1px solid var(--neon-yellow)',
          }}
        >
          <div className="grid grid-cols-2 gap-1">
            <div className="flex justify-between">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>REQUESTS:</span>
              <span style={{ color: 'var(--neon-cyan)' }}>
                {debugInfo.requests}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>ERRORS:</span>
              <span
                style={{
                  color:
                    debugInfo.errors > 0
                      ? 'var(--neon-pink)'
                      : 'var(--neon-green)',
                }}
              >
                {debugInfo.errors}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemInfo; 