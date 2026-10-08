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
    } else if (command === "next-group") {
        switchGroup();
    } else if (command === "previous-group") {
        switchGroup(false);
    } else if (command === "toggle-group") {
        toggleCurrentGroup();
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

async function switchGroup(next = true) {
    console.log("next group");
    const tab = await getActiveTab();
    const groups = await browser.tabGroups.query({ windowId: tab.windowId });

    if (groups.length === 0) {
        return;
    }

    const tabs = await browser.tabs.query({ windowId: tab.windowId });

    const i = groups.findIndex((g) => g.id === tab.groupId);
    nextIndex = next ? (i + 1) % groups.length : (i - 1 + groups.length) % groups.length;
    let target = groups[nextIndex];

    if (tab.groupId === -1) {
        target = next
            ? (groups.find((g) => groupStart(tabs, g.id) > tab.index) ?? groups[0])
            : (groups.findLast((g) => groupStart(tabs, g.id) < tab.index) ?? groups.at(-1));
    }

    const firstTab = tabs
        .filter((t) => t.groupId === target.id)
        .reduce((a, b) => (a.index < b.index ? a : b));
    await browser.tabs.update(firstTab.id, { active: true });
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

function groupStart(tabs, groupId) {
    return Math.min(...tabs.filter((t) => t.groupId === groupId).map((t) => t.index));
}

async function toggleCurrentGroup() {
    const tab = await getActiveTab();

    if (tab.groupId === -1) {
        return;
    }

    const group = await browser.tabGroups.get(tab.groupId);
    await browser.tabGroups.update(group.id, { collapsed: !group.collapsed });
}
