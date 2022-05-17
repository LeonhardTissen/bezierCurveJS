function bezierCurveInit(destination_element = document.body) {
	bc = {};
	// remove old container if it exists
	if (bc.container) {
		bc.container.remove()
	}
	bc.container = document.createElement('div');
	// width and height of the destination element
	let width;
	let height;
	if (destination_element === document.body) {
		width = window.innerWidth;
		height = window.innerHeight;
	} else {
		const boundingbox = destination_element.getBoundingClientRect();
		width = destination_element.width;
		height = destination_element.height;
	}
	destination_element.appendChild(bc.container)
	bc.container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" id='svgcontainer'>
	<path id="svgpath" style="stroke:#000;fill:none;">
	</svg>`
	bc.svg = document.getElementById('svgcontainer')
	// container size and position
	bc.container.position = 'absolute';
	bc.container.left = 0;
	bc.container.top = 0;
	bc.container.width = "100%";
	bc.container.height = "100%";
	// all of the variables
	bc.p = [];
	bc.handle_points = [];
	bc.ready_for_next_bezier = true;
	// add all of the events
	bc.container.onmousedown = bcMouseDown;
	bc.container.onmouseup = bcMouseUp;
	bc.container.onmousemove = bcMouseMove;
}
bezierCurveInit();

function bcMouseDown() {
	if (!bc.ready_for_next_bezier) {
		// first check if cursor is hovering over a handle
		for (let handle = 0; handle < bc.handle_points.length; handle ++) {
			if (checkIfTouch(
				bc.handle_points[handle][0], bc.x, 
				bc.handle_points[handle][1], bc.y)
			) {
				bc.current_handle = handle;
			}
		}
		return;
	}
	if (bc.about_to_reconnect) {
		// then check if cursor is hovering over end point
		bc.active_bezier = false;
		bc.ready_for_next_bezier = false;
		return;
	}
	// otherwise create a new point
	if (bc.p.length === 0) {
		bc.active_bezier = true;
		addClosingPoint(bc.x,bc.y);
	}
	// Add points and handle line
	bc.p.push([bc.x,bc.y,bc.x,bc.y,bc.x,bc.y])
	addPoint(bc.x,bc.y)
	addLine(bc.x,bc.y)
}

function bcMouseMove() {
	// change the mouse values
	bc.x = event.pageX - event.currentTarget.offsetLeft;
	bc.y = event.pageY - event.currentTarget.offsetTop;
	const l = bc.p.length - 1;
	bc.about_to_reconnect = false;
	if (!bc.ready_for_next_bezier) {
		// if not moving a handle, don't do anything
		if (bc.current_handle === undefined) return;
		// get the handle and the line element
		const handle = document.getElementById('handle' + bc.current_handle);
		const line = document.querySelector('.line' + bc.current_handle);
		const ch = bc.current_handle
		// the other side of the handle
		const x_alternate = bc.p[ch][0] - (bc.x - bc.p[ch][0])
		const y_alternate = bc.p[ch][1] - (bc.y - bc.p[ch][1])
		// set the handle points to the one of the mouse
		bc.handle_points[ch][0] = bc.x;
		bc.handle_points[ch][1] = bc.y;
		// change the points also
		bc.p[ch][2] = x_alternate;
		bc.p[ch][3] = y_alternate;
		bc.p[ch][4] = bc.x;
		bc.p[ch][5] = bc.y;
		// change the attributes of the handle element
		handle.setAttribute("cx", bc.x)
		handle.setAttribute("cy", bc.y)
		// change the attributes of the line element
		line.setAttribute("x1", x_alternate)
		line.setAttribute("y1", y_alternate)
		line.setAttribute("x2", bc.x)
		line.setAttribute("y2", bc.y)
	} else if (event.buttons === 0 && bc.closing_point && checkIfTouch(bc.closing_point[0], bc.x, bc.closing_point[1], bc.y)) {
		// when the mouse is hovering over the closing point, make it ready for a connect
		bc.about_to_reconnect = true;
	} else if (event.buttons !== 0) {
		// this is when you're dragging a new line
		// get the current line element
		const currentLine = document.getElementById('currentLine')
		// get the position of the other side of the line
		const x_alternate = bc.p[l][0] - (bc.x - bc.p[l][0])
		const y_alternate = bc.p[l][1] - (bc.y - bc.p[l][1])
		// set the points accordingly
		bc.p[l][2] = x_alternate;
		bc.p[l][3] = y_alternate;
		bc.p[l][4] = bc.x;
		bc.p[l][5] = bc.y;
		// change the attributes of the line element
		currentLine.setAttribute("x1", x_alternate)
		currentLine.setAttribute("y1", y_alternate)
		currentLine.setAttribute("x2", bc.x)
		currentLine.setAttribute("y2", bc.y)
	}
	generatePath(bc.x, bc.y)
}

function generatePath(cursor_x, cursor_y) {
	// if there are no points, don't start rendering
	if (bc.p.length == 0) return
	// rendering the path, if there is one
	// get the path element
	const svgpath = document.getElementById('svgpath');
	// start with m which is move to the first point without drawing
	const fpt = bc.p[0];
	bc.newpath = `m ${fpt[0]},${fpt[1]}`
	// loop through all the points
	for (var p = 1; p < bc.p.length; p ++) {
		// get the previous and current point needed for the curve
		const pt = bc.p[p];
		const prevpt = bc.p[p-1];
		// add the curve to the path
		appendCurve(prevpt[4], prevpt[5], pt[2], pt[3], pt[0], pt[1])
	}
	const lastpt = bc.p[bc.p.length-1]
	// whether to connect it up to the start or keep going towards the cursor
	if (bc.about_to_reconnect || !bc.active_bezier) {
		appendCurve(lastpt[4], lastpt[5], fpt[2], fpt[3], bc.closing_point[0], bc.closing_point[1])
	} else {
		appendCurve(lastpt[4], lastpt[5], cursor_x, cursor_y, cursor_x, cursor_y)
	}
	// set the generated path on the element
	svgpath.setAttribute('d',bc.newpath)
}

// adds a bezier curve to the svg path
function appendCurve(x1,y1,x2,y2,x3,y3) {
	bc.newpath += ` C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`
}

function bcMouseUp() {
	// remove contact from any handle
	bc.current_handle = undefined;

	const currentLine = document.getElementById('currentLine')
	if (currentLine == undefined) return
	// remove the currentLine id
	currentLine.removeAttribute('id');

	// create a handle at newly created line
	addHandlePoint(bc.x, bc.y)
}

// add a tiny circle as a point
function addPoint(x,y) {
	bc.svg.innerHTML += `<circle cx="${x}" cy="${y}" r="2" fill="black"/>`
}

// add a handle line
function addLine(x,y) {
	bc.svg.innerHTML += `<line class="line${bc.p.length-1}" x1="${x}" y1="${y}" x2="${x}" y2="${y}" stroke="black" id="currentLine"/>`
}

// add circle for the closing point
function addClosingPoint(x,y) {
	bc.closing_point = [x,y]
	bc.svg.innerHTML += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="black"/>`
}

// add circle for a handle point
function addHandlePoint(x,y) {
	bc.handle_points.push([x,y]);
	bc.svg.innerHTML += `<circle id="handle${bc.p.length-1}" cx="${x}" cy="${y}" r="8" fill="none" stroke="black"/>`
}

// check if two coordinates are close enough and return true or false accordingly
function checkIfTouch(x1,x2,y1,y2) {
	const distx = x1 - x2;
	const disty = y1 - y2;
	const dist = Math.sqrt(distx ** 2 + disty ** 2)
	return (dist < 10)
}