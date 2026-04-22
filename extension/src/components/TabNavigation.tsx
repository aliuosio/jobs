import type { TabId } from '../types';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'job-links', label: 'Job Links' },
  { id: 'forms-helper', label: 'Forms' },
];

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex border-b border-gray-200 bg-gray-50">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default TabNavigation;