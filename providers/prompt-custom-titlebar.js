const { Titlebar, Color } = require("custom-electron-titlebar");

module.exports = () => {
	new Titlebar({
		backgroundColor: Color.fromHex("#030303"),
		minimizable: false,
		maximizable: false,
		menu: null
	});
	const mainStyle = document.querySelector("#container").style;
	mainStyle.width = "100%";
	mainStyle.position = "fixed";
	mainStyle.border = "unset";
};
