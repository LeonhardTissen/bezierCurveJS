// init
const bc = document.createElement('div')
bc.style.position = 'absolute';
bc.style.left = 0;
bc.style.top = 0;
bc.style.width = "100vw";
bc.style.height = "100vh";

function newBezierCurve() {
	bc.innerHTML = `<svg viewBox="0 0 ${window.innerWidth} ${window.innerHeight}"" id='svgcontainer'></svg>`
}

newBezierCurve()
bc.onmousedown = function() {
	console.log(event)
	addPoint(event.clientX, event.clientY)
}

function addPoint(x,y) {
	bcsvg.innerHTML += `<circle cx="${x}" cy="${y}" r="2" fill="black"/>`
}

document.body.appendChild(bc)
const bcsvg = document.getElementById('svgcontainer')