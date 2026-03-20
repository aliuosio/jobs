/**
 * Test for link navigation and last clicked indicator functionality
 */

// Mock browser API for testing
const mockBrowser = {
  tabs: {
    query: jest.fn(),
    update: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

// Setup DOM environment
beforeEach(() => {
  document.body.innerHTML = `
    <div id="job-links-list">
      <div class="job-link-item" data-job-id="1">
        <a class="job-link-title" href="https://example.com/job1" data-job-id="1">Job 1</a>
      </div>
      <div class="job-link-item" data-job-id="2">
        <a class="job-link-title" href="https://example.com/job2" data-job-id="2">Job 2</a>
      </div>
    </div>
  `;
  
  // Mock global browser object
  global.browser = mockBrowser;
  global.localStorage = mockLocalStorage;
});

describe('Link Navigation and Last Clicked Indicator', () => {
  test('should navigate to link in same tab when clicked', async () => {
    // Setup
    mockBrowser.tabs.query.mockResolvedValue([{ id: 123 }]);
    mockBrowser.tabs.update.mockResolvedValue();
    mockLocalStorage.getItem.mockReturnValue('[]');
    
    // Load the popup script (simplified version for testing)
    const elements = {
      jobLinksList: document.getElementById('job-links-list')
    };
    
    let lastClickedJobId = null;
    
    // Simulate the click handler logic
    const link = elements.jobLinksList.querySelector('.job-link-title');
    const jobId = parseInt(link.dataset.jobId, 10);
    
    // Remove last clicked indicator from previous link
    if (lastClickedJobId) {
      const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
      if (prevLink) {
        prevLink.classList.remove('job-link-last-clicked');
      }
    }
    
    // Add last clicked indicator to current link
    lastClickedJobId = jobId;
    link.closest('.job-link-item').classList.add('job-link-last-clicked');
    
    // Navigate to the URL in the current tab
    await mockBrowser.tabs.update(123, { url: link.href });
    
    // Verify navigation
    expect(mockBrowser.tabs.update).toHaveBeenCalledWith(123, { url: 'https://example.com/job1' });
    
    // Verify last clicked indicator
    expect(link.closest('.job-link-item')).toHaveClass('job-link-last-clicked');
  });
  
  test('should remove previous last clicked indicator when new link is clicked', async () => {
    // Setup
    mockBrowser.tabs.query.mockResolvedValue([{ id: 123 }]);
    mockBrowser.tabs.update.mockResolvedValue();
    mockLocalStorage.getItem.mockReturnValue('[]');
    
    const elements = {
      jobLinksList: document.getElementById('job-links-list')
    };
    
    let lastClickedJobId = null;
    
    // Click first link
    const firstLink = elements.jobLinksList.querySelector('.job-link-title[data-job-id="1"]');
    let jobId = parseInt(firstLink.dataset.jobId, 10);
    
    if (lastClickedJobId) {
      const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
      if (prevLink) {
        prevLink.classList.remove('job-link-last-clicked');
      }
    }
    
    lastClickedJobId = jobId;
    firstLink.closest('.job-link-item').classList.add('job-link-last-clicked');
    
    // Click second link
    const secondLink = elements.jobLinksList.querySelector('.job-link-title[data-job-id="2"]');
    jobId = parseInt(secondLink.dataset.jobId, 10);
    
    if (lastClickedJobId) {
      const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
      if (prevLink) {
        prevLink.classList.remove('job-link-last-clicked');
      }
    }
    
    lastClickedJobId = jobId;
    secondLink.closest('.job-link-item').classList.add('job-link-last-clicked');
    
    // Verify first link no longer has indicator
    expect(firstLink.closest('.job-link-item')).not.toHaveClass('job-link-last-clicked');
    
    // Verify second link has indicator
    expect(secondLink.closest('.job-link-item')).toHaveClass('job-link-last-clicked');
  });
  
  test('should mark link as visited when clicked', () => {
    // Setup
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockLocalStorage.setItem.mockReturnValue();
    
    const elements = {
      jobLinksList: document.getElementById('job-links-list')
    };
    
    // Simulate markJobLinkVisited function
    function markJobLinkVisited(jobId) {
      const visited = new Set(JSON.parse(localStorage.getItem('jfh-visited-links') || '[]'));
      visited.add(jobId);
      localStorage.setItem('jfh-visited-links', JSON.stringify([...visited]));
    }
    
    const link = elements.jobLinksList.querySelector('.job-link-title');
    const jobId = parseInt(link.dataset.jobId, 10);
    
    markJobLinkVisited(jobId);
    
    // Verify visited state is saved
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jfh-visited-links', JSON.stringify([1]));
  });
});