browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab has a valid URL
    if ((changeInfo.status == "loading" || changeInfo.status == "complete") && tab.url) {
        // Query for all tabs with the same URL
        browser.tabs.query({ url: tab.url }).then(tabs => {
            if (tabs.length > 1) { // If more than one tab with the same URL is found
                // Find the first tab that is not the current tab
                const duplicateTab = tabs.find(t => t.id !== tabId);

                if (duplicateTab) {
                    // First, close the current tab
                    browser.tabs.remove(tabId).then(() => {
                        // After closing the tab, switch to the existing tab with the same URL
                        browser.tabs.update(duplicateTab.id, { active: true }).catch(error => {
                            console.error("Failed to switch to the duplicate tab:", error);
                        });
                    }).catch(error => {
                        console.error("Failed to close the tab:", error);
                    });
                }
            }
        }).catch(error => {
            console.error("Failed to query tabs:", error);
        });
    }
    else {
        console.log(changeInfo.status);
    }
});
