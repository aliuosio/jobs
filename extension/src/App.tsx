import { useState } from 'react';
import TabNavigation from './components/TabNavigation';
import JobLinksTab from './components/tabs/jobLinksTab';
import FormsHelperTab from './components/tabs/formsHelperTab';

export type TabId = 'job-links' | 'forms-helper';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('job-links');

  return (
    <div className="min-w-[360px] min-h-[480px] bg-white">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="p-4">
        {activeTab === 'job-links' && <JobLinksTab />}
        {activeTab === 'forms-helper' && <FormsHelperTab />}
      </main>
    </div>
  );
}

export default App;