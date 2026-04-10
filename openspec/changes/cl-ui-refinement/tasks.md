## 1. Remove Character Count Display

- [x] 1.1 Remove validation message (`validationMessage` variable) from renderJobLinksList in popup.js
- [x] 1.2 Remove validation message span from HTML template in popup.js

## 2. Simplify Generate Button Enable Logic

- [x] 2.1 Change `canGenerate` to check only description length (remove `isSaved` check)
- [x] 2.2 Simplify `hasLongDescription` usage if needed
- [x] 2.3 Update tooltip logic for disabled state

## 3. Add "Letter Available" Tooltip

- [x] 3.1 Modify tooltip to show "Letter available" when cl_status === 'ready'
- [x] 3.2 Keep existing tooltip for other disabled states

## 4. CSS Cleanup (Optional)

- [x] 4.1 Remove `.cl-validation-msg` CSS class from popup.css (no longer used)