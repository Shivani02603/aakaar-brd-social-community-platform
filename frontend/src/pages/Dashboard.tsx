import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, getUsers } from '../api/client';

interface DashboardStats {
  totalTasks: number;
  totalUsers: number;
  pendingTasks: number;
  activeUsers: number;
}

interface RecentItem {
  id: number;
  title: string;
  type: 'task' | 'user';
  date: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    totalUsers: 0,
    pendingTasks: 0,
    activeUsers: 0
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tasks, users] = await Promise.all([
        getTasks(),
        getUsers()
      ]);

      const pendingTasks = tasks.filter(task => task.status === 'pending').length;
      const activeUsers = users.filter(user => user.status === 'active').length;

      setStats({
        totalTasks: tasks.length,
        totalUsers: users.length,
        pendingTasks,
        activeUsers
      });

      const recentTasks = tasks
        .slice(0, 3)
        .map(task => ({
          id: task.id,
          title: task.title,
          type: 'task' as const,
          date: task.createdAt
        }));

      const recentUsers = users
        .slice(0, 3)
        .map(user => ({
          id: user.id,
          title: `${user.firstName} ${user.lastName}`,
          type: 'user' as const,
          date: user.createdAt
        }));

      const allRecent = [...recentTasks, ...recentUsers]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setRecentItems(allRecent);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      color: 'bg-blue-500',
      icon: '📋',
      link: '/tasks'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      color: 'bg-green-500',
      icon: '👥',
      link: '/users'
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      color: 'bg-yellow-500',
      icon: '⏳',
      link: '/tasks'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      color: 'bg-purple-500',
      icon: '✅',
      link: '/users'
    }
  ];

  const quickActions = [
    { label: 'Create New Task', link: '/tasks/new', icon: '➕' },
    { label: 'Create New User', link: '/users/new', icon: '👤' },
    { label: 'View All Tasks', link: '/tasks', icon: '📋' },
    { label: 'View All Users', link: '/users', icon: '👥' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} text-white p-3 rounded-full`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentItems.length > 0 ? (
                    recentItems.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <span className="text-xl mr-3">
                            {item.type === 'task' ? '📋' : '👤'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-500 capitalize">{item.type} • {new Date(item.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Link
                          to={`/${item.type}s/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Link
                      key={index}
                      to={action.link}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <span className="text-xl mr-3">{action.icon}</span>
                      <span className="font-medium text-gray-900">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;