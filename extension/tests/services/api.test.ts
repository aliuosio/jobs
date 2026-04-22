import { describe, it, expect, vi } from 'vitest';
import { apiService } from '../../src/services/api';

vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('chrome', { storage: { local: { get: vi.fn(), set: vi.fn() } } });

describe('apiService', () => {
  it('has getJobOffers function', () => {
    expect(typeof apiService.getJobOffers).toBe('function');
  });
});