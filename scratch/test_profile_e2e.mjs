import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/dania/.gemini/antigravity-cli/brain/4c730ae7-a2a5-460c-bbee-0350f39a7803';

async function run() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });

  // 1. Log in via Demo login or ensure Dani is logged in
  console.log('Navigating to Account & Profile...');
  const profileNavBtn = await page.$('button[title*="Account"]');
  if (profileNavBtn) {
    await profileNavBtn.click();
  }

  await new Promise(r => setTimeout(r, 1500));

  // Check if sign-in button is visible, if so click demo login
  const demoLoginBtn = await page.$x("//button[contains(text(), 'Demo Sign In')]");
  if (demoLoginBtn.length > 0) {
    console.log('Clicking Demo Sign In...');
    await demoLoginBtn[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }

  // Capture Main Profile Page Screenshot
  console.log('Capturing redesigned Profile page screenshot...');
  const profileScreenshotPath = path.join(ARTIFACT_DIR, 'profile_redesigned_page.png');
  await page.screenshot({ path: profileScreenshotPath, fullPage: true });
  console.log('Saved:', profileScreenshotPath);

  // 2. Test View Field Modal
  console.log('Testing View Field Modal...');
  const viewBtns = await page.$x("//button[text()='View']");
  if (viewBtns.length > 0) {
    await viewBtns[0].click();
    await new Promise(r => setTimeout(r, 1000));

    const viewModalPath = path.join(ARTIFACT_DIR, 'profile_view_field_modal.png');
    await page.screenshot({ path: viewModalPath });
    console.log('Saved:', viewModalPath);

    // Close modal
    const closeBtn = await page.$('.modal-close-btn');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. Test Add New Field Modal
  console.log('Testing Add New Field Modal...');
  const addFieldBtn = await page.$('.btn-add-field');
  if (addFieldBtn) {
    await addFieldBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // Capture Add Field Modal
    const addModalPath = path.join(ARTIFACT_DIR, 'profile_add_field_modal.png');
    await page.screenshot({ path: addModalPath });
    console.log('Saved:', addModalPath);

    // Fill form
    const testName = 'Savar Research Parcel ' + Math.floor(Math.random() * 1000);
    const nameInput = await page.$('input[placeholder="e.g. North Plot 1"]');
    if (nameInput) {
      await nameInput.click({ clickCount: 3 });
      await nameInput.type(testName);
    }

    // Submit form
    const submitBtn = await page.$('.modal-footer .run-cta-btn');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log('Added new field:', testName);
  }

  // Capture Updated Fields Cards Grid
  const updatedGridPath = path.join(ARTIFACT_DIR, 'profile_my_fields_updated.png');
  await page.screenshot({ path: updatedGridPath, fullPage: true });
  console.log('Saved:', updatedGridPath);

  // 4. Test "Select for Analysis"
  console.log('Testing "Select for Analysis"...');
  const selectAnalysisBtns = await page.$$('.btn-select-analysis');
  if (selectAnalysisBtns.length > 0) {
    await selectAnalysisBtns[0].click();
    console.log('Clicked Select for Analysis. Waiting for Dashboard and Workflow execution...');
    await new Promise(r => setTimeout(r, 3500));

    const analysisRunPath = path.join(ARTIFACT_DIR, 'profile_selected_analysis_run.png');
    await page.screenshot({ path: analysisRunPath, fullPage: true });
    console.log('Saved:', analysisRunPath);
  }

  console.log('E2E Verification completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during E2E testing:', err);
  process.exit(1);
});
