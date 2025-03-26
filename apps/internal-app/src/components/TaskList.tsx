import React, { useEffect, useState } from 'react';

interface Task {
  _id: string;
  creatorTelegramId: number;
  creatorTelegramUsername: string;
  creatorEVMAddress: string;
  prompt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://bots.midcurve.live/api/tasks', {
          headers: {
            Authorization:
              `Bearer ${import.meta.env.VITE_TG_BEARER_TOKEN}` as string,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setTasks(data);

        // Sort tasks by createdAt in descending order (newest first)
        const sortedTasks = [...data].sort(
          (a: Task, b: Task) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Find in progress task
        const inProgressTask = sortedTasks.find(
          (task: Task) => task.status === 'in_progress'
        );

        // Set current task if there's an in-progress task
        setCurrentTask(inProgressTask || null);

        // Filter pending tasks
        const filteredPendingTasks = sortedTasks.filter(
          (task: Task) => task.status === 'pending'
        );
        setPendingTasks(filteredPendingTasks);

        // Filter completed tasks and limit to 2
        const filteredCompletedTasks = sortedTasks
          .filter((task: Task) => task.status === 'completed')
          .slice(0, 2);
        setCompletedTasks(filteredCompletedTasks);

        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLastUpdated(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchTasks();

    // Set up interval to fetch tasks every 10 seconds
    const intervalId = setInterval(fetchTasks, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Get status color based on task status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'var(--neon-green)';
      case 'failed':
      case 'error':
        return 'var(--neon-pink)';
      case 'in_progress':
      case 'processing':
        return 'var(--neon-cyan)';
      case 'pending':
        return 'var(--neon-yellow)';
      default:
        return 'var(--neon-purple)';
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  };

  return (
    <div className="overlay-element task-list">
      <div className="flex flex-col p-2">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{
              color: 'var(--neon-purple)',
              textShadow: '0 0 5px var(--neon-purple)',
            }}
          >
            TASK.MONITOR
          </span>
          <div
            className="px-2 text-xs"
            style={{
              border: '1px solid var(--neon-purple)',
              borderRadius: '2px',
              color: 'var(--neon-purple)',
            }}
          >
            v1.0
          </div>
        </div>

        {/* Current Task Section */}
        <div
          className="p-2 bg-gray-800 bg-opacity-60 rounded-sm mb-2"
          style={{
            borderLeft: `2px solid ${currentTask ? getStatusColor(currentTask.status) : 'var(--neon-yellow)'}`,
          }}
        >
          <div className="flex items-center mb-1">
            <div
              className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{
                backgroundColor: currentTask
                  ? getStatusColor(currentTask.status)
                  : 'var(--neon-yellow)',
                boxShadow: `0 0 5px ${currentTask ? getStatusColor(currentTask.status) : 'var(--neon-yellow)'}`,
              }}
            />
            <span
              className="font-bold text-xs tracking-wide"
              style={{ color: 'white' }}
            >
              CURRENT TASK
            </span>
            {isLoading && (
              <div
                className="ml-2 w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--neon-cyan)' }}
              />
            )}
          </div>

          {currentTask ? (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center text-xs">
                <span style={{ color: 'rgba(255,255,255,0.5)', width: '60px' }}>
                  CREATOR
                </span>
                <span style={{ color: 'var(--neon-cyan)' }}>
                  @{currentTask.creatorTelegramUsername}
                </span>
              </div>

              <div className="flex items-start text-xs">
                <span style={{ color: 'rgba(255,255,255,0.5)', width: '60px' }}>
                  PROMPT
                </span>
                <span style={{ color: 'var(--neon-yellow)' }}>
                  {currentTask.prompt}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <div className="flex items-center">
                  <span
                    style={{ color: 'rgba(255,255,255,0.5)', width: '60px' }}
                  >
                    STATUS
                  </span>
                  <span style={{ color: getStatusColor(currentTask.status) }}>
                    {currentTask.status.toUpperCase()}
                  </span>
                </div>

                <span style={{ color: 'var(--neon-green)' }}>
                  {formatDate(currentTask.createdAt).split(',')[1].trim()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-xs">
              <span style={{ color: 'var(--neon-yellow)' }}>NONE</span>
            </div>
          )}
        </div>

        {/* Upcoming Tasks - Pending Only */}
        <div className="mt-1">
          <div className="flex justify-between items-center mb-1">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--neon-purple)' }}
            >
              UPCOMING TASKS
            </span>
            <span className="text-xs" style={{ color: 'var(--neon-cyan)' }}>
              {pendingTasks.length} PENDING
            </span>
          </div>

          {pendingTasks.length > 0 ? (
            <div
              className="bg-gray-800 bg-opacity-60 rounded-sm p-1 overflow-auto"
              style={{
                maxHeight: '120px',
                borderLeft: '1px solid var(--neon-purple)',
              }}
            >
              {pendingTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-1 mb-1 rounded-sm text-xs"
                  style={{
                    background: 'rgba(15, 15, 18, 0.8)',
                    borderLeft: `2px solid ${getStatusColor(task.status)}`,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--neon-cyan)' }}>
                      @{task.creatorTelegramUsername}
                    </span>
                    <span
                      className="text-xs px-1 rounded"
                      style={{ color: getStatusColor(task.status) }}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--neon-yellow)' }}>
                    {task.prompt}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="p-1 text-center text-xs"
              style={{ color: 'var(--neon-pink)' }}
            >
              {error}
            </div>
          ) : (
            <div
              className="p-1 text-center text-xs"
              style={{ color: 'var(--neon-yellow)' }}
            />
          )}
        </div>

        {/* Completed Tasks Section */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--neon-purple)' }}
            >
              COMPLETED TASKS
            </span>
            <span className="text-xs" style={{ color: 'var(--neon-green)' }}>
              {completedTasks.length} RECENT
            </span>
          </div>

          {completedTasks.length > 0 ? (
            <div
              className="bg-gray-800 bg-opacity-60 rounded-sm p-1 overflow-auto"
              style={{
                maxHeight: '120px',
                borderLeft: '1px solid var(--neon-purple)',
              }}
            >
              {completedTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-1 mb-1 rounded-sm text-xs"
                  style={{
                    background: 'rgba(15, 15, 18, 0.8)',
                    borderLeft: `2px solid ${getStatusColor(task.status)}`,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--neon-cyan)' }}>
                      @{task.creatorTelegramUsername}
                    </span>
                    <span
                      className="text-xs px-1 rounded"
                      style={{ color: getStatusColor(task.status) }}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--neon-yellow)' }}>
                    {task.prompt}
                  </div>
                  <div
                    className="text-right text-xs"
                    style={{ color: 'var(--neon-green)' }}
                  >
                    {formatDate(task.createdAt).split(',')[1].trim()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="p-1 text-center text-xs"
              style={{ color: 'var(--neon-yellow)' }}
            >
              NO COMPLETED TASKS
            </div>
          )}
        </div>

        {/* Minimalistic last updated timestamp */}
        {lastUpdated && (
          <div className="text-xs mt-1 flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>LAST SYNC:</span>
            <span style={{ color: 'var(--neon-cyan)' }}>{lastUpdated}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
