const { urgencyLevels, setOption } = require("./utils");
const is = require("electron-is");

module.exports = (win, options) => [
	...(is.linux() ?
		[{
			label: "Notification Priority",
			submenu: urgencyLevels.map(level => ({
				label: level.name,
				type: "radio",
				checked: options.urgency === level.value,
				click: () => setOption(options, "urgency", level.value)
			})),
		}] :
		[]),
	{
		label: "Show notification on unpause",
		type: "checkbox",
		checked: options.unpauseNotification,
		click: (item) => setOption(options, "unpauseNotification", item.checked)
	},
];
