function stripHashtagFromUrl(url) {
    return url.replace(/#[^\/]*\/?$/, '')
}
function stripVersionFromUrl(url) {
    return url.replace(/\/v[^\/]*\/?$/, '')
}
function removeTrailingSlashFromUrl(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}
function getCompareUrl(url) {
    return removeTrailingSlashFromUrl(stripVersionFromUrl(stripHashtagFromUrl(url)));
}

let cachedUrlsToClose = null;

function fetchUrlsToClose() {
    // If the URLs are already cached, return them immediately
    if (cachedUrlsToClose !== null) {
        return Promise.resolve(cachedUrlsToClose);
    }

    // If not cached, fetch the URLs and cache them
    return fetch(browser.runtime.getURL('UrlsToClose.txt'))
        .then(response => response.text())
        .then(text => {
            cachedUrlsToClose = text.split(/\r?\n/).filter(Boolean);  // Split by newlines and remove empty lines
            return cachedUrlsToClose;
        });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab has a valid URL
    if ((changeInfo.status == "loading" || changeInfo.status == "complete") && tab.url) {
        console.log(getCompareUrl(tab.url));
        const strippedUrl = getCompareUrl(tab.url);
        // Query for all tabs with the same URL
        browser.tabs.query({}).then(tabs => {
            const matchingTabs = tabs.filter(t => getCompareUrl(t.url) === strippedUrl);
            if (matchingTabs.length > 1) { // If more than one tab with the same URL is found
                // Find the first tab that is not the current tab
                const duplicateTab = matchingTabs.find(t => t.id !== tabId);
                
                console.log("Duplicate Tab:" + duplicateTab.url);

                if (duplicateTab) {
                    // First, close the current tab
                    browser.tabs.remove(tabId).then(() => {
                        // After closing the tab, switch to the existing tab with the same URL
                        browser.tabs.update(duplicateTab.id, { active: true }).catch(error => {
                            console.error("Failed to switch to the duplicate tab:", error);
                        });
                        browser.tabs.reload(duplicateTab.id);
                    }).catch(error => {
                        console.error("Failed to close the tab:", error);
                    });
                }
            }
        }).catch(error => {
            console.error("Failed to query tabs:", error);
        });
    }
	
    // Fetch the URLs to close and check if the current tab should be closed
    fetchUrlsToClose().then(urlsToClose => {
        const hostname = new URL(tab.url).hostname;
        if (urlsToClose.includes(hostname)) {
            console.log("Closing tab with URL:", tab.url);
            browser.tabs.remove(tabId).catch(error => {
                console.error("Failed to close the tab:", error);
            });
        }
     }).catch(error => {
         console.error("Failed to fetch URLs to close:", error);
     });
});
