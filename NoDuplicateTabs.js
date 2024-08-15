function stripHashtagFromUrl(url) {
    return url.replace(/#[^\/]*\/?$/, '');
}

function stripVersionFromUrl(url) {
    return url.replace(/\/v[^\/]*\/?$/, '');
}

function removeTrailingSlashFromUrl(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getCompareUrl(url) {
    return removeTrailingSlashFromUrl(stripVersionFromUrl(stripHashtagFromUrl(url)));
}

let cachedUrlsToClose = null;

function fetchUrlsToClose() {
    if (cachedUrlsToClose !== null) {
        return Promise.resolve(cachedUrlsToClose);
    }

    return fetch(chrome.runtime.getURL('UrlsToClose.txt'))
        .then(response => response.text())
        .then(text => {
            cachedUrlsToClose = text.split(/\r?\n/).filter(Boolean);
            return cachedUrlsToClose;
        });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if ((changeInfo.status === "loading" || changeInfo.status === "complete") && tab.url) {
        const strippedUrl = getCompareUrl(tab.url);
		console.log(strippedUrl);

        chrome.tabs.query({}, (tabs) => {
            const matchingTabs = tabs.filter(t => getCompareUrl(t.url) === strippedUrl);
            if (matchingTabs.length > 1) {
                const duplicateTab = matchingTabs.find(t => t.id !== tabId);

                if (duplicateTab) {
                    chrome.tabs.remove(tabId, () => {
                        chrome.tabs.update(duplicateTab.id, { active: true }, () => {
                            chrome.tabs.reload(duplicateTab.id);
                        });
                    });
                }
            }
        });
    }

    fetchUrlsToClose().then(urlsToClose => {
        const hostname = new URL(tab.url).hostname;
		console.log(hostname);
        if (urlsToClose.includes(hostname)) {
            chrome.tabs.remove(tabId);
        }
    }).catch(error => {
        console.error("Failed to fetch URLs to close:", error);
    });
});

