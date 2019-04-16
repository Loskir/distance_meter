const SVG_SIZE_X = 20
const SVG_SIZE_Y = 20
const SVG_OFFSET_X = -10
const SVG_OFFSET_Y = -10
const ACCURACY = 0.1

const svg = document.getElementById('svg')
const functionPolyline = document.getElementById('function')
const distancePolyline = document.getElementById('distance')
const distanceGraphPolyline = document.getElementById('distance-graph')
const textInput = document.getElementById('text')
const button = document.getElementById('apply')
const distance = document.getElementById('distance-text')

const circle = document.getElementById('circle')

button.addEventListener('click', apply)

let calculateAllowed = true
let changes = false

let formula
let distanceFormulaText = ''
let distanceFormula

let x1 = 0
let y1 = 0
apply()

function setFormula(text) {
  formula = math.parse(text)
  updateDistanceFormulaText()
}
function updateDistanceFormulaText() {
  distanceFormulaText = `sqrt(pow(x1-x, 2)+pow(y1-(${formula.toString()}) , 2))`
  distanceFormula = math.parse(distanceFormulaText)
}

function getVal(x) {
  return convertY(formula.eval({x}))
}

function convertY(y) {
  return SVG_SIZE_Y + 2*SVG_OFFSET_Y - Math.max(-500, Math.min(y, 500))
}

function drawFormula(polyline, formula, params = {}) {
  let x = SVG_OFFSET_X
  let path = []

  while (x <= SVG_SIZE_X+SVG_OFFSET_X) {
    path.push(`${x},${convertY(formula.eval({x, ...params}))}`)
    x += ACCURACY
  }

  polyline.setAttribute('points', path.join(' '))
}

let iterateTimeout = setTimeout(() => {})
let iterateRunning = false

function apply() {
  const text = textInput.value
  console.log(text)

  setFormula(text)

  console.log(formula)

  drawFormula(functionPolyline, formula)
}

function updateDistanceFormulaGraph() {
  const x = x1

  const distanceFormula = math.parse(distanceFormulaText)
  drawFormula(distanceGraphPolyline, distanceFormula, {x1, y1})

  distancePolyline.setAttribute('points', `${x1},${convertY(y1)} ${x},${getVal(x)}`)
  distance.innerHTML = distanceFormula.eval({x1, y1, x})
  circle.setAttribute('cx', x)
  circle.setAttribute('cy', convertY(distanceFormula.eval({x1, y1, x})))
}

function updateDistancePolyline(x) {
  distancePolyline.setAttribute('points', `${x1},${convertY(y1)} ${x},${getVal(x)}`)
  distance.innerHTML = distanceFormula.eval({x1, y1, x})
  circle.setAttribute('cx', x)
  circle.setAttribute('cy', convertY(distanceFormula.eval({x1, y1, x})))
}

svg.addEventListener('mousemove', handleMousemove)

function handleMousemove(e) {
  const gbcr = svg.getBoundingClientRect()

  x1 = e.offsetX / gbcr.width * SVG_SIZE_X + SVG_OFFSET_X
  y1 = SVG_SIZE_Y - e.offsetY / gbcr.height * SVG_SIZE_Y + SVG_OFFSET_Y
  if (!calculateAllowed) {
    changes = true
    return
  }

  updateDistanceFormulaGraph()

  calculate()
  calculateAllowed = false
  setTimeout(() => {
    calculateAllowed = true
  }, 50)
}

function calculate() {
  // console.log('calculate')

  let x = x1
  let lr = .002

  const deriv = math.derivative(distanceFormulaText, 'x')

  let i = 0

  // iterationRuns++

  let iterate = () => {
    // if (iterationRuns !== currentRun) {
    //   console.log(`exiting ${currentRun}`)
    //   return
    // }
    if (!iterateRunning) {
      console.log(`exiting`)
      return
    }
    if (i === 100000) {
      updateDistancePolyline(x)
      return
    }

    const delta = lr*deriv.eval({x1, y1, x})

    if (Math.abs(delta) < 1e-14) {
      console.log(`exit on ${i}, delta: ${delta}`)
      updateDistancePolyline(x)
      return
    }

    // console.log(x, deriv.eval({x1, y1, x}))
    // if (Math.abs(delta) < 0.0005) {
    //   console.log(`exit on iteration ${i}`)
    //   break
    // }
    x -= delta

    i++

    if (i%200 === 199) {
      // console.log('update')
      updateDistancePolyline(x)
      return setTimeout(iterate, 10)
    }
    return iterate()
  }

  clearTimeout(iterateTimeout)
  iterateRunning = false
  iterateTimeout = setTimeout(() => {
    // let currentRun = iterationRuns

    console.log(`starting iterate`)

    updateDistanceFormulaGraph()

    iterateRunning = true
    iterate()
  }, 500)
}
