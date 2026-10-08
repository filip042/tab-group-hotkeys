(async function init() {
    const commands = await browser.commands.getAll();
    const list = document.querySelector("#shortcuts");

    for (const command of commands) {
        const row = document.createElement("li");
        row.textContent = `${command.description}: ${command.shortcut || "Not set"}`;
        list.appendChild(row);
    }
})();