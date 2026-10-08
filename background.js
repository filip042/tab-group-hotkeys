let pickerMode = null;

browser.commands.onCommand.addListener((command) => {
    if (command === "new-tab-in-group") {
        newTabInGroup();
    } else if (command === "new-tab-in-chosen-group") {
        pickerMode = "new-tab";
        browser.action.openPopup().catch(() => { pickerMode = null; });
    } else if (command === "add-tab-to-group") {
        pickerMode = "move-tab";
        browser.action.openPopup().catch(() => { pickerMode = null; });
    }
});

browser.runtime.onMessage.addListener((message) => {
    if (message.type === "get-mode") {
        const mode = pickerMode;
        pickerMode = null;
        return Promise.resolve(mode);
    }
    if (message.type === "new-tab-at-end-of-group") {
        return newTabAtEndOfGroup(message.groupId, message.windowId);
    }
});

async function getActiveTab() {
    const [tab] = await browser.tabs.query({ lastFocusedWindow: true, active: true });
    return tab;
}

async function newTabInGroup() {
    const tab = await getActiveTab();
    if (tab.groupId === -1) {
        await browser.tabs.create({ windowId: tab.windowId });
        return;
    }
    await newTabAtEndOfGroup(tab.groupId, tab.windowId);
}

async function newTabAtEndOfGroup(groupId, windowId) {
    const tabs = await browser.tabs.query({ windowId });
    const lastIndex = Math.max(
        ...tabs.filter((t) => t.groupId === groupId).map((t) => t.index)
    );
    const newTab = await browser.tabs.create({ windowId, index: lastIndex + 1 });
    await browser.tabs.group({ groupId, tabIds: newTab.id });
    return newTab;
}