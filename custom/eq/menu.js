const prompt = require("custom-electron-prompt");


const AudioContext = window.AudioContext || window.webkitAudioContext;
// Import Tuna
var context = new AudioContext();
var tuna = new Tuna(context);

const { setMenuOptions } = require("../../config/plugins");
const promptOptions = require("../../providers/prompt-options");
//const { clear, connect, registerRefresh, isConnected } = require("./back");


let hasRegisterred = true;


var chorus = new tuna.Chorus({
    rate: 1.5,
    feedback: 0.2,
    delay: 0.0045,
    bypass: 0
});

var input = context.createGain();
var output = context.createGain();

// Connect the nodes together
input.connect(chorus.input);
chorus.connect(output);


// Use Tuna for equalizer
function setTuna() {
	const tuna = new Tuna(context);
	const eq = new tuna.Equalizer({
		frequencies: [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
		gain: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	});
	return eq;
}



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

