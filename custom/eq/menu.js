const prompt = require("custom-electron-prompt");

const { setMenuOptions } = require("../../config/plugins");
const promptOptions = require("../../providers/prompt-options");
//const { clear, connect, registerRefresh, isConnected } = require("./back");

let hasRegisterred = true;

// Export setEqualizer function
module.exports.setEqualizer = setEqualizer;
// Create GUI for equalizer
async function setEqualizer(win, options) {
	let output = await prompt({
		title: 'Equalizer',
		label: 'Set the bars below to set the Equalizer:',
		value: '0,0,0,0,0,0,0,0,0,0',
		type: "counter",
		counterOptions: { minimum: 0, multiFire: true },
		width: 450,
		...promptOptions()
	}, win)
	/*
		type: 'input',
		// Create eq manager
		inputAttrs: {
			type: 'range',
			min: '-10',
			max: '10',
			step: '1',
			list: 'eq',
			style: 'width: 100%;'
		},

	});*/
	if (output === null) {
		console.log('user cancelled');
	} else {
		console.log(output);		
	}
	/*
		value: Math.round((options.activityTimoutTime ?? 0) / 1e3),
		type: "counter",
		counterOptions: { minimum: 0, multiFire: true },
		width: 450,
		...promptOptions()
	},
	win)*/
}

