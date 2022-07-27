const { existsSync } = require("fs");
const path = require("path");

const { app, Menu, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const is = require("electron-is");
const { restart } = require("./providers/app-controls");

const { getAllPlugins } = require("./plugins/utils");
const config = require("./config");

const prompt = require("custom-electron-prompt");
const promptOptions = require("./providers/prompt-options");
const { main } = require("electron-is");
let askedForUpdate = false;
// Export the boolean askedForUpdate variable to be used in the main process

// true only if in-app-menu was loaded on launch
const inAppMenuActive = config.plugins.isEnabled("in-app-menu");

//Hack Packaged
Object.defineProperty(app, 'isPackaged', {
	get() {
	  return true;
	}
});


const pluginEnabledMenu = (plugin, label = "", hasSubmenu = false, refreshMenu = undefined) => ({
	label: label || plugin,
	type: "checkbox",
	checked: config.plugins.isEnabled(plugin),
	click: (item) => {
		if (item.checked) {
			config.plugins.enable(plugin);
		} else {
			config.plugins.disable(plugin);
		}
		if (hasSubmenu) {
			refreshMenu();
		}
	},
});

const mainMenuTemplate = (win) => {
	const refreshMenu = () => {
		this.setApplicationMenu(win);
		if (inAppMenuActive) {
			win.webContents.send("refreshMenu");
		}
	}
	return [
		{
			label: "Plugins",
			submenu: [
				
				...getAllPlugins().map((plugin) => {
					console.log(`${plugin} plugin is loaded`);
					const pluginPath = path.join(__dirname, "plugins", plugin, "menu.js")
					if (existsSync(pluginPath)) {
						if (!config.plugins.isEnabled(plugin)) {
							return pluginEnabledMenu(plugin, "", true, refreshMenu);
						}
						const getPluginMenu = require(pluginPath);
						return {
							label: plugin,
							submenu: [
								pluginEnabledMenu(plugin, "Enabled", true, refreshMenu),
								{ type: "separator" },
								...getPluginMenu(win, config.plugins.getOptions(plugin), refreshMenu),
							],
						};
					}

					return pluginEnabledMenu(plugin);
				}),
			],
		},
		
		/*
		{
			label: "Test",
			submenu: [
				//Get the menu from eq plugin
				{
					label: "Test",
					submenu: [
						{
							label: "Set eq",
							click: () => {
								// import setEqualizer is a function from eq plugin
								const { setEqualizer } = require("./custom/eq/menu.js");
								win.webContents.send("setEq", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
								
								setEqualizer(win, config.plugins.getOptions("eq"), refreshMenu);
							},
						},
					],
				},


			],
		},
		*/
		
		{
			label: "Audio",
			submenu: [
				{
					label: "Equalizer (WIP)",
					submenu: [
						{
							label: "Enable",
							type: "checkbox",
							checked: config.get("options.equalizer.enabled"),
							click: (item) => {
								if (item.checked) {
									config.set("options.equalizer.enabled", true);
								} else {
									config.set("options.equalizer.enabled", false);
								}
								refreshMenu();
							}
						},
						{ type: "separator" },
						{
							label: "Open Equalizer",
							click: () => {
								const { setEqualizer } = require("./custom/eq/menu.js");
								win.webContents.send("setEq", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
								
								setEqualizer(win, config.plugins.getOptions("eq"), refreshMenu);
							}
						},
					],
				},
				{
					label: "Volume",
					submenu: [
						{
							label: "Increase",
							click: () => {
								win.webContents.send("volume", "increase");

							}
						},
						{
							label: "Decrease",
							click: () => {
								win.webContents.send("volume", "decrease");
							}
						},
						{ type: "separator" },
						{
							label: "Mute",
							type: "checkbox",
							checked: config.get("options.volume.muted"),
							click: (item) => {
								if (item.checked) {
									win.webContents.send("volume", "mute");
									config.set("options.volume.muted", true);
								} else {
									win.webContents.send("volume", "unmute");
									config.set("options.volume.muted", false);
								}
								refreshMenu();
							}
						},
					],
				},
			],
		},
		{
			label: "Options",
			submenu: [
				{
					label: "Auto-update",
					type: "checkbox",
					checked: config.get("options.autoUpdates"),
					click: (item) => {
						config.setMenuOption("options.autoUpdates", item.checked);
					},
				},
				{
					label: "Resume last song when app starts",
					type: "checkbox",
					checked: config.get("options.resumeOnStart"),
					click: (item) => {
						config.setMenuOption("options.resumeOnStart", item.checked);
					},
				},
				{
					label: "Visual Tweaks",
					submenu: [
						{
							label: "Remove upgrade button",
							type: "checkbox",
							checked: config.get("options.removeUpgradeButton"),
							click: (item) => {
								config.setMenuOption("options.removeUpgradeButton", item.checked);
							},
						},
						{
							label: "Force show like buttons",
							type: "checkbox",
							checked: config.get("options.ForceShowLikeButtons"),
							click: (item) => {
								config.set("options.ForceShowLikeButtons", item.checked);
							},
						},
					],
				},
				{
					label: "Single instance lock",
					type: "checkbox",
					checked: config.get("options.singleInstanceLock"),
					click: (item) => {
						config.setMenuOption("options.singleInstanceLock", item.checked);
						if (item.checked && !app.hasSingleInstanceLock()) {
							app.requestSingleInstanceLock();
						} else if (!item.checked && app.hasSingleInstanceLock()) {
							app.releaseSingleInstanceLock();
						}
					},
				},
				{
					label: "Always on top",
					type: "checkbox",
					checked: config.get("options.alwaysOnTop"),
					click: (item) => {
						config.setMenuOption("options.alwaysOnTop", item.checked);
						win.setAlwaysOnTop(item.checked);
					},
				},
				...(is.windows() || is.linux()
					? [
						{
							label: "Hide menu",
							type: "checkbox",
							checked: config.get("options.hideMenu"),
							click: (item) => {
								config.setMenuOption("options.hideMenu", item.checked);
								if (item.checked && !config.get("options.hideMenuWarned")) {
									dialog.showMessageBox(win, {
										type: 'info', title: 'Hide Menu Enabled',
										message: "Menu will be hidden on next launch, use 'Alt' to show it (or 'Escape' if using in-app-menu)"
									});
								}
							},
						},
					]
					: []),
				...(is.windows() || is.macOS()
					? // Only works on Win/Mac
					// https://www.electronjs.org/docs/api/app#appsetloginitemsettingssettings-macos-windows
					[
						{
							label: "Start at login",
							type: "checkbox",
							checked: config.get("options.startAtLogin"),
							click: (item) => {
								config.setMenuOption("options.startAtLogin", item.checked);
							},
						},
					]
					: []),
				{
					label: "Tray",
					submenu: [
						{
							label: "Disabled",
							type: "radio",
							checked: !config.get("options.tray"),
							click: () => {
								config.setMenuOption("options.tray", false);
								config.setMenuOption("options.appVisible", true);
							},
						},
						{
							label: "Enabled + app visible",
							type: "radio",
							checked:
								config.get("options.tray") && config.get("options.appVisible"),
							click: () => {
								config.setMenuOption("options.tray", true);
								config.setMenuOption("options.appVisible", true);
							},
						},
						{
							label: "Enabled + app hidden",
							type: "radio",
							checked:
								config.get("options.tray") && !config.get("options.appVisible"),
							click: () => {
								config.setMenuOption("options.tray", true);
								config.setMenuOption("options.appVisible", false);
							},
						},
						{ type: "separator" },
						{
							label: "Play/Pause on click",
							type: "checkbox",
							checked: config.get("options.trayClickPlayPause"),
							click: (item) => {
								config.setMenuOption("options.trayClickPlayPause", item.checked);
							},
						},
					],
				},
				{ type: "separator" },
				{
					label: "Advanced options",
					submenu: [
						{
							label: "Proxy",
							type: "checkbox",
							checked: !!config.get("options.proxy"),
							click: (item) => {
								setProxy(item, win);
							},
						},
						{
							label: "Override useragent",
							type: "checkbox",
							checked: config.get("options.overrideUserAgent"),
							click: (item) => {
								config.setMenuOption("options.overrideUserAgent", item.checked);
							}
						},
						{
							label: "Disable hardware acceleration",
							type: "checkbox",
							checked: config.get("options.disableHardwareAcceleration"),
							click: (item) => {
								config.setMenuOption("options.disableHardwareAcceleration", item.checked);
							},
						},
						{
							label: "Restart on config changes",
							type: "checkbox",
							checked: config.get("options.restartOnConfigChanges"),
							click: (item) => {
								config.setMenuOption("options.restartOnConfigChanges", item.checked);
							},
						},
						{
							label: "Reset App cache when app starts",
							type: "checkbox",
							checked: config.get("options.autoResetAppCache"),
							click: (item) => {
								config.setMenuOption("options.autoResetAppCache", item.checked);
							},
						},
						{ type: "separator" },
						is.macOS() ?
							{
								label: "Toggle DevTools",
								// Cannot use "toggleDevTools" role in MacOS
								click: () => {
									const { webContents } = win;
									if (webContents.isDevToolsOpened()) {
										webContents.closeDevTools();
									} else {
										const devToolsOptions = {};
										webContents.openDevTools(devToolsOptions);
									}
								},
							} :
							{ role: "toggleDevTools" },
						{
							label: "Edit config.json",
							click: () => {
								config.edit();
							},
						},
					]
				},
			],
		},
		{
			label: "View",
			submenu: [
				{ role: "reload" },
				{ role: "forceReload" },
				{ type: "separator" },
				{ role: "zoomIn" },
				{ role: "zoomOut" },
				{ role: "resetZoom" },
				{ type: "separator" },
				{ role: "togglefullscreen" },
			],
		},
		{
			label: "Navigation",
			submenu: [
				{
					label: "Go back",
					click: () => {
						if (win.webContents.canGoBack()) {
							win.webContents.goBack();
						}
					},
				},
				{
					label: "Go forward",
					click: () => {
						if (win.webContents.canGoForward()) {
							win.webContents.goForward();
						}
					},
				},
				{
					label: "Restart App",
					click: restart
				},
				{ role: "quit" },
			],
		},
		{
			label: "Help",
			submenu: [
				{
					label: "Learn More",
					click: () => {
						shell.openExternal("https://github.com/XaviFortes/media-player/wiki");
					}
				},
				{
					label: "Check for updates",
					click: () => {
						//check for updates button
						askedForUpdate = true;
						autoUpdater.checkForUpdates();
						
						
						//shell.openExternal("https://github.com/XaviFortes/media-player/releases");
					}
				},
				{
					label: "Report an issue",
					click: () => {
						shell.openExternal("https://github.com/XaviFortes/media-player/issues/new");
					}
				},
				{
					label: "About",
					click: () => {
						dialog.showMessageBox(null, about);
					}
				},
			],
		},
	];
}

const about = {
	icon: "../assets/youtube-music.png",
	type: "info",
	title: "Media Player",
	message: `Welcome to Youtube Music App!\nThis is an app that plays youtube songs.\nYou can use the menu to change the configuration of the app.\nYou can also use the keyboard shortcuts to do the same things.\nCurrent Version: ${app.getVersion()}\n\nEnjoy!`,
	buttons: ["UwU"],
	defaultId: 0,
	cancelId: 0,
};
//If theres a new version, it will show a message box

/*
autoUpdater.on("update-available", () => {
	dialog.showMessageBox(null, {
		icon: "../assets/youtube-music.png",
		type: "info",
		title: "Media Player",
		message: `A new version of Media Player is available!\nClick OK to update.`,
		buttons: ["OK"],
		defaultId: 0,
		cancelId: 0,
	});
}
);
*/

/*
autoUpdater.on("update-available", () => {
	const downloadLink = "https://github.com/XaviFortes/media-player/releases/latest";
	dialog.showMessageBox(null,{
		icon: "../assets/youtube-music.png",
		type: "info",
		buttons: ["OK", "Download"],
		defaultId: 0,
		cancelId: 0,
		title: "Application Update",
		message: "A new version is available",
		//Get remote new version
		detail: `Version ${downloadLink} is available.\nClick OK to download the latest version.`,
		//detail: `Version  is available.\nCurrent: ${app.getVersion()}\nYou can download it from ${downloadLink}\nRelease Notes: ${autoUpdater.available.releaseNotes}`,
		//detail: `Version  is available.\nCurrent: ${app.getVersion()}\nYou can download it from ${downloadLink}`,
	}, (response) => {
		switch (response) {
			case 0:
				break;
			case 1:
				autoUpdater.downloadUpdate();
				autoUpdater.on("update-downloaded", () => {
					autoUpdater.quitAndInstall();
				}
				);
				electron.shell.openExternal(downloadLink);
				break;
			}
	});
}
);*/

/*
	dialog.showMessageBox(null, dialogOpts).then((dialogOutput) => {
		switch (dialogOutput.response) {
			// Download
			case 1:
				autoUpdater.downloadUpdate();
				autoUpdater.on("update-downloaded", () => {
					autoUpdater.quitAndInstall();
				}
				);
				electron.shell.openExternal(downloadLink);
				break;
			// Disable updates
			//case 2:
			//	config.set("options.autoUpdates", false);
			//	break;
			default:
				break;
		}
	});
});*/


module.exports.askedForUpdate = askedForUpdate;
module.exports.mainMenuTemplate = mainMenuTemplate;
module.exports.setApplicationMenu = (win) => {
	const menuTemplate = [...mainMenuTemplate(win)];
	if (process.platform === "darwin") {
		const name = app.name;
		menuTemplate.unshift({
			label: name,
			submenu: [
				{ role: "about" },
				{ type: "separator" },
				{ role: "hide" },
				{ role: "hideothers" },
				{ role: "unhide" },
				{ type: "separator" },
				{
					label: "Select All",
					accelerator: "CmdOrCtrl+A",
					selector: "selectAll:",
				},
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ type: "separator" },
				{ role: "minimize" },
				{ role: "close" },
				{ role: "quit" },
			],
		});
	}

	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
};

async function setProxy(item, win) {
	const output = await prompt({
		title: 'Set Proxy',
		label: 'Enter Proxy Address: (leave empty to disable)',
		value: config.get("options.proxy"),
		type: 'input',
		inputAttrs: {
			type: 'url',
			placeholder: "Example: 'socks5://127.0.0.1:9999"
		},
		width: 450,
		...promptOptions()
	}, win);

	if (typeof output === "string") {
		config.setMenuOption("options.proxy", output);
		item.checked = output !== "";
	} else { //user pressed cancel
		item.checked = !item.checked; //reset checkbox
	}
}
