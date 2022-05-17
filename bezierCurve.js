let bezierCurve = {};
function bezierCurveInit(destination_element = document.body) {
	// remove old container if it exists
	if (bezierCurve.container) {
		bezierCurve.container.remove()
	}
	bezierCurve.container = document.createElement('div');
	destination_element.appendChild(bezierCurve.container)
	bezierCurve.container.innerHTML = `<svg viewBox="0 0 ${window.innerWidth} ${window.innerHeight}" id='svgcontainer'>
	<path id="svgpath" style="stroke:#000;fill:none;">
	</svg>`
	bezierCurve.svg = document.getElementById('svgcontainer')
	// container size and position
	bezierCurve.container.position = 'absolute';
	bezierCurve.container.left = 0;
	bezierCurve.container.top = 0;
	bezierCurve.container.width = window.innerWidth;
	bezierCurve.container.height = window.innerHeight;
	// all of the variables
	bezierCurve.points = [];
	bezierCurve.handle_points = [];
	bezierCurve.about_to_reconnect = false;
	bezierCurve.active_bezier = false;
	bezierCurve.ready_for_next_bezier = true;
	// add all of the events
	bezierCurve.container.onmousedown = bcMouseDown;
	bezierCurve.container.onmouseup = bcMouseUp;
	bezierCurve.container.onmousemove = bcMouseMove;
}
bezierCurveInit();

function bcMouseDown() {
	const x = event.clientX;
	const y = event.clientY;
	if (!bezierCurve.ready_for_next_bezier) {
		// first check if cursor is hovering over a handle
		for (let handle = 0; handle < bezierCurve.handle_points.length; handle ++) {
			if (checkIfTouch(bezierCurve.handle_points[handle][0], x, bezierCurve.handle_points[handle][1], y)) {
				bezierCurve.current_handle = handle;
			}
		}
		return;
	}
	if (bezierCurve.about_to_reconnect) {
		// then check if cursor is hovering over end point
		bezierCurve.active_bezier = false;
		bezierCurve.ready_for_next_bezier = false;
		return;
	}
	// otherwise create a new point
	if (bezierCurve.points.length === 0) {
		bezierCurve.active_bezier = true;
		addClosingPoint(x,y);
	}
	// Add points and handle line
	bezierCurve.points.push([x,y,x,y,x,y])
	addPoint(x,y)
	addLine(x,y)
}

function bcMouseMove() {
	const x = event.clientX;
	const y = event.clientY;
	const l = bezierCurve.points.length - 1;
	bezierCurve.about_to_reconnect = false;
	if (!bezierCurve.ready_for_next_bezier) {
		if (bezierCurve.current_handle !== undefined) {
			// get the handle and the line element
			const handle = document.getElementById('handle' + bezierCurve.current_handle);
			const line = document.querySelector('.line' + bezierCurve.current_handle);
			// the other side of the handle
			const x_alternate = bezierCurve.points[bezierCurve.current_handle][0] - (x - bezierCurve.points[bezierCurve.current_handle][0])
			const y_alternate = bezierCurve.points[bezierCurve.current_handle][1] - (y - bezierCurve.points[bezierCurve.current_handle][1])
			// set the handle points to the one of the mouse
			bezierCurve.handle_points[bezierCurve.current_handle][0] = x;
			bezierCurve.handle_points[bezierCurve.current_handle][1] = y;
			// change the points also
			bezierCurve.points[bezierCurve.current_handle][2] = x_alternate;
			bezierCurve.points[bezierCurve.current_handle][3] = y_alternate;
			bezierCurve.points[bezierCurve.current_handle][4] = x;
			bezierCurve.points[bezierCurve.current_handle][5] = y;
			// change the attributes of the handle element
			handle.setAttribute("cx", x)
			handle.setAttribute("cy", y)
			// change the attributes of the line element
			try {
				line.setAttribute("x1", x_alternate)
				line.setAttribute("y1", y_alternate)
				line.setAttribute("x2", x)
				line.setAttribute("y2", y)
			} catch (err) {}
		} else {
			return;
		}
	} else if (event.buttons === 0 && bezierCurve.closing_point && checkIfTouch(bezierCurve.closing_point[0], x, bezierCurve.closing_point[1], y)) {
		// when the mouse is hovering over the closing point, make it ready for a connect
		bezierCurve.about_to_reconnect = true;
	} else if (event.buttons !== 0) {
		// this is when you're dragging a new line
		// get the current line element
		const currentLine = document.getElementById('currentLine')
		// get the position of the other side of the line
		const x_alternate = bezierCurve.points[l][0] - (x - bezierCurve.points[l][0])
		const y_alternate = bezierCurve.points[l][1] - (y - bezierCurve.points[l][1])
		// set the points accordingly
		bezierCurve.points[l][2] = x_alternate;
		bezierCurve.points[l][3] = y_alternate;
		bezierCurve.points[l][4] = x;
		bezierCurve.points[l][5] = y;
		// change the attributes of the line element
		try {
			currentLine.setAttribute("x1", x_alternate)
			currentLine.setAttribute("y1", y_alternate)
			currentLine.setAttribute("x2", x)
			currentLine.setAttribute("y2", y)
		} catch (err) {}
	}
	generatePath(x, y)
}

function generatePath(cursor_x, cursor_y) {
	// if there are no points, don't start rendering
	if (bezierCurve.points.length == 0) return

	// rendering the path, if there is one
	// get the path element
	const svgpath = document.getElementById('svgpath');
	// start with m which is move to the first point without drawing
	const fpt = bezierCurve.points[0];
	var newpath = `m ${fpt[0]},${fpt[1]}`
	// loop through all the points
	for (var p = 1; p < bezierCurve.points.length; p ++) {
		// get the previous and current point needed for the curve
		const pt = bezierCurve.points[p];
		const prevpt = bezierCurve.points[p-1];
		// add the curve to the path
		newpath += ` C ${prevpt[4]} ${prevpt[5]}, ${pt[2]} ${pt[3]}, ${pt[0]} ${pt[1]}`;
	}
	const lastpt = bezierCurve.points[bezierCurve.points.length-1]
	// whether to connect it up to the start or keep going towards the cursor
	if (bezierCurve.about_to_reconnect || !bezierCurve.active_bezier) {
		newpath += ` C ${lastpt[4]} ${lastpt[5]}, ${fpt[2]} ${fpt[3]}, ${bezierCurve.closing_point[0]} ${bezierCurve.closing_point[1]}`
	} else {
		newpath += ` C ${lastpt[4]} ${lastpt[5]}, ${cursor_x} ${cursor_y}, ${cursor_x} ${cursor_y}`
	}
	// set the generated path on the element
	svgpath.setAttribute('d',newpath)
}

function bcMouseUp() {
	// remove contact from any handle
	bezierCurve.current_handle = undefined;

	const currentLine = document.getElementById('currentLine')
	if (currentLine == undefined) return
	// remove the currentLine id
	currentLine.removeAttribute('id');

	// create a handle at newly created line
	addHandlePoint(event.clientX,event.clientY)
}

// add a tiny circle as a point
function addPoint(x,y) {
	bezierCurve.svg.innerHTML += `<circle cx="${x}" cy="${y}" r="2" fill="black"/>`
}

// add a handle line
function addLine(x,y) {
	bezierCurve.svg.innerHTML += `<line class="line${bezierCurve.points.length-1}" x1="${x}" y1="${y}" x2="${x}" y2="${y}" stroke="black" id="currentLine"/>`
}

// add circle for the closing point
function addClosingPoint(x,y) {
	bezierCurve.closing_point = [x,y]
	bezierCurve.svg.innerHTML += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="black"/>`
}

// add circle for a handle point
function addHandlePoint(x,y) {
	bezierCurve.handle_points.push([x,y]);
	bezierCurve.svg.innerHTML += `<circle id="handle${bezierCurve.points.length-1}" cx="${x}" cy="${y}" r="8" fill="none" stroke="black"/>`
}

// check if two coordinates are close enough and return true or false accordingly
function checkIfTouch(x1,x2,y1,y2) {
	const distx = x1 - x2;
	const disty = y1 - y2;
	const dist = Math.sqrt(distx ** 2 + disty ** 2)
	return (dist < 10)
}