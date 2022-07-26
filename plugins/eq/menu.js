const prompt = require("custom-electron-prompt");

const { setMenuOptions } = require("../../config/plugins");
const promptOptions = require("../../providers/prompt-options");
//const { clear, connect, registerRefresh, isConnected } = require("./back");

let hasRegisterred = true;

module.exports = (win, options, refreshMenu) => {
	
    if (!hasRegisterred) {
		registerRefresh(refreshMenu);
		hasRegisterred = true;
	}
    

	return [
		{
			label: "Set eq",
			click: () => setEqualizer(win, options),
		},
	];
};

async function setEqualizer(win, options) {
	let output = await prompt({
		title: 'Set Inactivity Timeout',
		label: 'Enter inactivity timeout in seconds:',
		value: Math.round((options.activityTimoutTime ?? 0) / 1e3),
		type: "counter",
		counterOptions: { minimum: 0, multiFire: true },
		width: 450,
		...promptOptions()
	}, win)

	if (output) {
		options.activityTimoutTime = Math.round(output * 1e3);
		setMenuOptions("discord", options);
	}
}
