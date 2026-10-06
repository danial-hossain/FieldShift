from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173/')
    page.wait_for_timeout(2000)
    page.locator('button[title*="Account, Profile"]').first.click()
    page.wait_for_timeout(2000)
    
    matches = page.evaluate('''() => {
        const results = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.nodeValue && node.nodeValue.toLowerCase().includes('svg')) {
                results.push({
                    text: node.nodeValue.trim(),
                    parentTag: node.parentElement ? node.parentElement.tagName : null,
                    parentClass: node.parentElement ? node.parentElement.className : null
                });
            }
        }
        return results;
    }''')
    print('DOM text nodes containing svg:', matches)
    browser.close()
