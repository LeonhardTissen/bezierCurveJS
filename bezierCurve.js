// init
const bc = document.createElement('div')
bc.style.position = 'absolute';
bc.style.left = 0;
bc.style.top = 0;
bc.style.width = "100vw";
bc.style.height = "100vh";
let points = [];
let handle_points = [];
let closing_point;
let about_to_reconnect = false;
let active_bezier = false;
let ready_for_next_bezier = true;
let current_handle;

function newBezierCurve() {
	points = []
	bc.innerHTML = `<svg viewBox="0 0 ${window.innerWidth} ${window.innerHeight}" id='svgcontainer'>
	<path id="svgpath" style="stroke:#000;fill:none">
	</svg>`
}

newBezierCurve()
bc.onmousedown = function() {
	const x = event.clientX;
	const y = event.clientY;
	if (!ready_for_next_bezier) {
		handle_points.forEach((h) => {
			if (checkIfTouch(h[0],x,h[1],y)) {
				current_handle = h[2]
			}
		})

		return
	}
	if (about_to_reconnect) {
		active_bezier = false;
		ready_for_next_bezier = false;
		return
	}
	active_bezier = true;
	if (points.length === 0) {
		addClosingPoint(x,y)
	}
	points.push([x,y,x,y,x,y])
	addPoint(x,y)
	addLine(x,y)
}

bc.onmousemove = function() {
	const x = event.clientX;
	const y = event.clientY;
	const l = points.length - 1;
	if (!ready_for_next_bezier) {
		if (current_handle !== undefined) {
			const handle = document.getElementById('handle' + current_handle);
			const line = document.querySelector('.line' + current_handle);
			console.log(current_handle)
			points[current_handle][4] = x;
			points[current_handle][5] = y;
			handle_points[current_handle][0] = x;
			handle_points[current_handle][1] = y;
			handle.setAttribute("cx", x)
			handle.setAttribute("cy", y)
			const xa = points[current_handle][0] - (x - points[current_handle][0])
			const ya = points[current_handle][1] - (y - points[current_handle][1])
			try {
				line.setAttribute("x1", xa)
				line.setAttribute("y1", ya)
				line.setAttribute("x2", x)
				line.setAttribute("y2", y)
			} catch (err) {}
			console.log(points)
		} else {
			return;
		}
	}
	about_to_reconnect = false;
	if (event.buttons === 0 && closing_point && checkIfTouch(closing_point[0], x, closing_point[1], y)) {
		about_to_reconnect = true;
	} else if (event.buttons !== 0) {
		const currentLine = document.getElementById('currentLine')
		const xa = points[l][0] - (x - points[l][0])
		const ya = points[l][1] - (y - points[l][1])
		points[l][2] = xa;
		points[l][3] = ya;
		points[l][4] = x;
		points[l][5] = y;
		try {
			currentLine.setAttribute("x1", xa)
			currentLine.setAttribute("y1", ya)
			currentLine.setAttribute("x2", x)
			currentLine.setAttribute("y2", y)
		} catch (err) {}
	}
	if (points.length > 0) {
		const svgpath = document.getElementById('svgpath');
		var newpath = `m ${points[0][0]},${points[0][1]}`
		for (var p = 0; p < points.length; p ++) {
			const pt = points[p]
			if (p == 0) {
				newpath += ` C ${pt[2]} ${pt[3]}, ${pt[2]} ${pt[3]}, ${pt[0]} ${pt[1]}`
			} else {
				const prevpt = points[p-1]
				newpath += ` C ${prevpt[4]} ${prevpt[5]}, ${pt[2]} ${pt[3]}, ${pt[0]} ${pt[1]}`
			}
		}
		if (points.length > 0) {
			const prevpt = points[p-1]
			if (about_to_reconnect || !active_bezier) {
				newpath += ` C ${prevpt[4]} ${prevpt[5]}, ${points[0][2]} ${points[0][3]}, ${closing_point[0]} ${closing_point[1]}`
			} else {
				newpath += ` C ${prevpt[4]} ${prevpt[5]}, ${x} ${y}, ${x} ${y}`
			}
		}
		svgpath.setAttribute('d',newpath)
	}
}

bc.onmouseup = function() {
	current_handle = undefined;
	try {
		const currentLine = document.getElementById('currentLine')
		currentLine.removeAttribute('id');
		addHandlePoint(event.clientX,event.clientY)
	} catch (err) {}
}

function addPoint(x,y) {
	bcsvg.innerHTML += `<circle cx="${x}" cy="${y}" r="2" fill="black"/>`
}

function addLine(x,y) {
	bcsvg.innerHTML += `<line class="line${points.length-1}" x1="${x}" y1="${y}" x2="${x}" y2="${y}" stroke="black" id="currentLine"/>`
}

function addClosingPoint(x,y) {
	closing_point = [x,y]
	bcsvg.innerHTML += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="black"/>`
}

function addHandlePoint(x,y) {
	handle_points.push([x,y,points.length-1]);
	bcsvg.innerHTML += `<circle id="handle${points.length-1}" cx="${x}" cy="${y}" r="8" fill="none" stroke="black"/>`
}

function checkIfTouch(x1,x2,y1,y2) {
	const distx = x1 - x2;
	const disty = y1 - y2;
	const dist = Math.sqrt(distx ** 2 + disty ** 2)
	return (dist < 10)
}

document.body.appendChild(bc)
const bcsvg = document.getElementById('svgcontainer')