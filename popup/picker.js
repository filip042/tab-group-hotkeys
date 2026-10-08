(async function route() {
    const mode = await browser.runtime.sendMessage({ type: "get-mode" });

    if (mode === "new-tab" || mode === "move-tab") {
        document.querySelector("#heading").textContent = mode === "new-tab" ? "Open new tab in…" : "Move tab to…";
    } else {
        location.replace("settings.html");
        return;
    }

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const groups = await browser.tabGroups.query({ windowId: tab.windowId });

    const noGroupButton = document.createElement("button");
    noGroupButton.textContent = "No group";
    noGroupButton.addEventListener("click", async () => {
        if (mode === "new-tab") {
            await browser.tabs.create({ windowId: tab.windowId });
        } else {
            await browser.tabs.ungroup(tab.id);
        }
        window.close();
    });
    document.querySelector("#popup-content").appendChild(noGroupButton);

    for (const group of groups) {
        const button = document.createElement("BUTTON");
        button.textContent = group.title || "Unnamed group";
        button.dataset.color = group.color;
        button.addEventListener("click", async () => {
            if (mode === "new-tab") {
                await browser.runtime.sendMessage({ type: "new-tab-at-end-of-group", groupId: group.id, windowId: tab.windowId });
            } else {
                await browser.tabs.group({ groupId: group.id, tabIds: tab.id });
                const tabs = await browser.tabs.query({ windowId: tab.windowId });
                const lastIndex = Math.max(...tabs.filter((t) => t.groupId === group.id).map((t) => t.index));
                await browser.tabs.move(tab.id, { index: lastIndex });
            }
            window.close();
        })
        document.querySelector("#popup-content").appendChild(button);
    }
    document.querySelector("#popup-content button")?.focus();
    document.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
            return;
        }
        const buttons = [...document.querySelectorAll("#popup-content button")];
        const i = buttons.indexOf(document.activeElement);
        const step = e.key === "ArrowDown" ? 1 : -1;
        const next = (i + step + buttons.length) % buttons.length;
        buttons[next].focus();
        e.preventDefault();
    });
})();
