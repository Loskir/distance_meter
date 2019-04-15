const svg = document.getElementById('svg')
const functionPolyline = document.getElementById('function')
const distancePolyline = document.getElementById('distance')
const distanceGraphPolyline = document.getElementById('distance-graph')
const textInput = document.getElementById('text')
const button = document.getElementById('apply')
const distance = document.getElementById('distance-text')

const circle = document.getElementById('circle')

button.addEventListener('click', apply)

let iterationRuns = 0
let savedE
let calculateAllowed = true
let changes = false

let formula
let distanceFormulaText = ''

let x1 = 0
let y1 = 0
apply()

function setFormula(text) {
  formula = math.parse(text)
  updateDistanceFormulaText()
}
function updateDistanceFormulaText() {
  distanceFormulaText = `sqrt(pow(x1-x, 2)+pow(y1-(${formula.toString()}) , 2))`
}

function getVal(x) {
  return convertY(formula.eval({x}))
}

function convertY(y) {
  return 500 - Math.max(-500, Math.min(y, 1000))
}

function drawFormula(polyline, formula, params = {}) {
  let x = 0
  let path = []

  while (x <= 500) {
    path.push(`${x},${convertY(formula.eval({x, ...params}))}`)
    x += 1
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

svg.addEventListener('mousemove', handleMousemove)

function handleMousemove(e) {
  const gbcr = svg.getBoundingClientRect()

  x1 = e.offsetX / gbcr.width * 500
  y1 = 500 - e.offsetY / gbcr.height * 500
  if (!calculateAllowed) {
    changes = true
    return
  }
  const x = x1

  const distanceFormula = math.parse(distanceFormulaText)
  drawFormula(distanceGraphPolyline, distanceFormula, {x1, y1})

  distancePolyline.setAttribute('points', `${x1},${500-y1} ${x},${getVal(x)}`)
  distance.innerHTML = distanceFormula.eval({x1, y1, x})
  circle.setAttribute('cx', x)
  circle.setAttribute('cy', convertY(distanceFormula.eval({x1, y1, x}), 1000))

  calculate()
  calculateAllowed = false
  setTimeout(() => {
    calculateAllowed = true
  }, 50)
}66

function calculate() {
  // console.log('calculate')
  // changes = false

  const distanceFormula = math.parse(distanceFormulaText)

  let x = x1
  let lr = .1

  const deriv = math.derivative(distanceFormulaText, 'x')

  let i = 0

  // iterationRuns++

  let iterate = (currentRun) => {
    // if (iterationRuns !== currentRun) {
    //   console.log(`exiting ${currentRun}`)
    //   return
    // }
    if (!iterateRunning) {
      console.log(`exiting ${currentRun}`)
      return
    }
    if (i === 100000) {
      return
    }

    const delta = lr*deriv.eval({x1, y1, x})

    if (Math.abs(delta) < 1e-14) {
      console.log(`exit on ${i}, delta: ${delta}`)
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
      distancePolyline.setAttribute('points', `${x1},${500-y1} ${x},${getVal(x)}`)
      distance.innerHTML = distanceFormula.eval({x1, y1, x})
      circle.setAttribute('cx', x)
      circle.setAttribute('cy', convertY(distanceFormula.eval({x1, y1, x}), 1000))
      return setTimeout(() => iterate(currentRun), 10)
    }
    return iterate(currentRun)
  }

  clearTimeout(iterateTimeout)
  iterateRunning = false
  iterateTimeout = setTimeout(() => {
    // let currentRun = iterationRuns

    console.log(`starting iterate`)

    iterateRunning = true
    iterate()
  }, 500)
}
