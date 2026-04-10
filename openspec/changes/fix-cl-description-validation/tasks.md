## 1. Add Minimum Description Length Constant

- [x] 1.1 Add `MIN_DESCRIPTION_LENGTH = 200` constant to popup.js storage constants section (around line 10-30)
- [x] 1.2 Verify constant is placed in a logical location with other configuration constants

## 2. Fix Enable Logic in renderJobLinksList

- [x] 2.1 Update `hasLongDescription` calculation to use `MIN_DESCRIPTION_LENGTH` threshold
- [x] 2.2 Fix `canGenerate` logic to check BOTH `cl_status === 'saved' || cl_status === 'ready'` AND `descriptionLength >= MIN_DESCRIPTION_LENGTH`
- [x] 2.3 Add validation message display showing current length vs required (e.g., "50/200")
- [x] 2.4 Update button tooltip to show validation failure reason

## 3. Remove /job-applications Polling Dependency

- [x] 3.1 Find and remove the `/job-applications` polling code in handleClGenerate function
- [x] 3.2 Update completion detection to rely on existing SSE job offers update mechanism
- [x] 3.3 Add timeout fallback (3 minutes) if SSE doesn't indicate completion

## 4. Testing and Verification

- [ ] 4.1 Test with description < 200 chars - button should be disabled
- [ ] 4.2 Test with description >= 200 chars, not saved - button should be disabled (cl_status check)
- [ ] 4.3 Test with description >= 200 chars, saved - button should be enabled
- [ ] 4.4 Verify tooltip displays correctly on disabled button
- [ ] 4.5 Verify character count display shows current/required format

## 5. Documentation

- [x] 5.1 Update comment explaining the MIN_DESCRIPTION_LENGTH constant
- [x] 5.2 Add inline documentation for the new validation logic