let ctx, analyser, data, bgstate
const bgstates = ["bass", "mid", "high", "off"]
bgstate = 0

alert("If you go blind or something bad happens to you from watching this then this is not my fault. This is your warning so beware.")

document.getElementById('start').addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const src = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    src.connect(analyser)
    analyser.smoothingTimeConstant = 0.75
    data = new Uint8Array(analyser.frequencyBinCount)
    loop()
})

document.getElementById("bgtoggle").addEventListener('click', () => {
    bgstate + 1 == 4 ? bgstate = 0 : bgstate += 1
    document.getElementById("bgtoggle").innerHTML = `Background reaction toggle - ${bgstates[bgstate]}`
})

function band(db, source, destination) {
    const nyquist = ctx.sampleRate / 2
    const i0 = Math.max(0, Math.floor(source / nyquist * db.length))
    const i1 = Math.min(db.length - 1, Math.floor(destination / nyquist * db.length))
    let sum = 0
    for (let i = i0; i <= i1; i++) sum += db[i]
    return sum / (i1 - i0 + 1);
}

function colors(b, m, h) {
    const clamp = (v) => Math.max(0, Math.min(1, ((v - 60) / 140)))
    const c1 = `hsl(${200 + clamp((b - 60) / 140) * 40}, 80%, ${20 + clamp((b - 60) / 140) * 40}%)`
    const c2 = `hsl(${280 + clamp((m - 60) / 140) * 40}, 80%, ${15 + clamp((m - 60) / 140) * 45}%)`
    const c3 = `hsl(${240 + clamp((h - 60) / 140) * 40}, 80%, ${10 + clamp((h - 60) / 140) * 50}%)`
    return [c1, c2, c3]
}

function loop() {
    requestAnimationFrame(loop)
    analyser.getByteFrequencyData(data)
    const b = band(data, 20, 160)
    const m = band(data, 160, 2000)
    const h = band(data, 2000, 8000)

    // Math time, yay
    const bass = `${b * 800 / 255}px`
    const mid = `${m * 550 / 255}px`
    const high = `${h * 300 / 255}px`
    /*
    Equivalent of solving with ratios, ex: b/255 = x/800 while solving for x
    Explanation because idk:
        b because that's the bass value over 255 (what the bass value is out of, or its max) is equal to x (the size of the new circle we are solving for)
        over 800 (the max pixels the circle is out of). It would look something like this and we act like b is not unknown because it's substituted later anyways:
            b   x
            - = -
           255 800
        We would basically cross-multiply to get 800b = 255x. If this doesn't make sense then that sucks because I'm done teaching. I need to finish homework so no more documentation today.
    */ 
    

    document.getElementById('bass').style.height = bass
    document.getElementById('bass').style.width = bass

    document.getElementById('mid').style.width = mid
    document.getElementById('mid').style.height = mid

    document.getElementById('high').style.height = high
    document.getElementById('high').style.width = high

    document.body.style.background = `hsl(200, 80%, ${bgstate == 0 ? b : bgstate == 1 ? m : bgstate == 2 ? h : 2 / 2}%)`

}
