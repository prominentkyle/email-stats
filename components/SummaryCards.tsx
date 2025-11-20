interface SummaryCardsProps {
  stats: {
    totalEmails: number;
    totalSent: number;
    totalReceived: number;
    filesEdited: number;
    filesViewed: number;
    uniqueUsers: number;
    avgEmailsPerUser: number;
  };
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Emails',
      value: stats.totalEmails.toLocaleString(),
      icon: '📧',
      color: 'from-blue-600 to-blue-400',
    },
    {
      title: 'Emails Sent',
      value: stats.totalSent.toLocaleString(),
      icon: '📤',
      color: 'from-green-600 to-green-400',
    },
    {
      title: 'Emails Received',
      value: stats.totalReceived.toLocaleString(),
      icon: '📥',
      color: 'from-purple-600 to-purple-400',
    },
    {
      title: 'Files Edited',
      value: stats.filesEdited.toLocaleString(),
      icon: '✏️',
      color: 'from-orange-600 to-orange-400',
    },
    {
      title: 'Files Viewed',
      value: stats.filesViewed.toLocaleString(),
      icon: '👁️',
      color: 'from-pink-600 to-pink-400',
    },
    {
      title: 'Active Users',
      value: stats.uniqueUsers.toLocaleString(),
      icon: '👥',
      color: 'from-indigo-600 to-indigo-400',
    },
    {
      title: 'Avg Emails/User',
      value: stats.avgEmailsPerUser.toLocaleString(),
      icon: '📊',
      color: 'from-cyan-600 to-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="text-3xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
